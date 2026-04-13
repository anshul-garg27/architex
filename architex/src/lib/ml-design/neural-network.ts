// ─────────────────────────────────────────────────────────────
// Architex — ML Design: Neural Network Training Engine
// ─────────────────────────────────────────────────────────────
//
// From-scratch feed-forward neural network with configurable
// layers, Xavier weight initialization, forward/backward pass,
// and pluggable activations, loss functions, and optimizers
// from the existing ML core library.
// ─────────────────────────────────────────────────────────────

import {
  relu,
  reluDerivative,
  sigmoid,
  sigmoidDerivative,
  tanh as tanhActivation,
  tanhDerivative,
  leakyRelu,
  leakyReluDerivative,
} from "./activations";
import {
  mse,
  mseDerivative,
  binaryCrossEntropy,
  binaryCrossEntropyDerivative,
} from "./loss-functions";
import type { Optimizer } from "./optimizers";

// ── Types ──────────────────────────────────────────────────

export type ActivationName = "relu" | "sigmoid" | "tanh" | "leakyRelu";

export type LossFunctionName = "mse" | "binaryCrossEntropy";

export interface TrainOptions {
  epochs: number;
  learningRate: number;
  optimizer: Optimizer;
  lossFunction: LossFunctionName;
  onEpoch?: (metrics: EpochMetrics) => void;
}

export interface EpochMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
}

export interface DatasetSample {
  input: number[];
  target: number[];
}

export interface SerializedWeights {
  layers: Array<{
    weights: number[][];
    biases: number[];
  }>;
}

// ── Activation dispatch ─────────────────────────────────────

function applyActivation(x: number, name: ActivationName): number {
  switch (name) {
    case "relu":
      return relu(x);
    case "sigmoid":
      return sigmoid(x);
    case "tanh":
      return tanhActivation(x);
    case "leakyRelu":
      return leakyRelu(x);
  }
}

/**
 * Compute the activation derivative.
 *
 * - For sigmoid and tanh, the derivative is expressed in terms of the
 *   activation **output** (as defined in activations.ts).
 * - For relu and leakyRelu, the derivative uses the **pre-activation**
 *   value (z) since the output clips negative information.
 *
 * We pass both `z` (pre-activation) and `a` (post-activation) so the
 * correct value is always available.
 */
function applyActivationDerivative(
  z: number,
  a: number,
  name: ActivationName,
): number {
  switch (name) {
    case "relu":
      return reluDerivative(z);
    case "sigmoid":
      return sigmoidDerivative(a);
    case "tanh":
      return tanhDerivative(a);
    case "leakyRelu":
      return leakyReluDerivative(z);
  }
}

// ── Loss dispatch ───────────────────────────────────────────

function computeLoss(
  predicted: number[],
  actual: number[],
  name: LossFunctionName,
): number {
  switch (name) {
    case "mse":
      return mse(predicted, actual);
    case "binaryCrossEntropy":
      return binaryCrossEntropy(predicted, actual);
  }
}

function computeLossDerivative(
  predicted: number[],
  actual: number[],
  name: LossFunctionName,
): number[] {
  switch (name) {
    case "mse":
      return mseDerivative(predicted, actual);
    case "binaryCrossEntropy":
      return binaryCrossEntropyDerivative(predicted, actual);
  }
}

// ── Layer internal state ────────────────────────────────────

interface LayerState {
  weights: number[][]; // [inputSize][outputSize]
  biases: number[]; // [outputSize]
  inputSize: number;
  outputSize: number;
  activation: ActivationName;
}

// ── NeuralNetwork class ─────────────────────────────────────

export class NeuralNetwork {
  private layerStates: LayerState[];
  private readonly layerSizes: number[];
  private readonly activationName: ActivationName;

  // Stored during forward pass for backprop
  private preActivations: number[][] = [];
  private activations: number[][] = [];

  /**
   * Create a fully-connected neural network.
   *
   * @param layerSizes - Array of sizes: [inputSize, ...hiddenSizes, outputSize]
   * @param activation - Activation function for all hidden layers.
   *                     The output layer uses sigmoid for binary classification.
   */
  constructor(layerSizes: number[], activation: ActivationName = "relu") {
    if (layerSizes.length < 2) {
      throw new Error("Need at least input and output layer sizes");
    }
    this.layerSizes = layerSizes;
    this.activationName = activation;
    this.layerStates = [];

    for (let l = 0; l < layerSizes.length - 1; l++) {
      const inputSize = layerSizes[l];
      const outputSize = layerSizes[l + 1];
      const isOutputLayer = l === layerSizes.length - 2;

      // Xavier (Glorot) initialization: scale = sqrt(2 / (fan_in + fan_out))
      const scale = Math.sqrt(2 / (inputSize + outputSize));

      const weights: number[][] = [];
      for (let i = 0; i < inputSize; i++) {
        const row: number[] = [];
        for (let j = 0; j < outputSize; j++) {
          row.push(randomNormal() * scale);
        }
        weights.push(row);
      }

      const biases = new Array<number>(outputSize).fill(0);

      this.layerStates.push({
        weights,
        biases,
        inputSize,
        outputSize,
        activation: isOutputLayer ? "sigmoid" : activation,
      });
    }
  }

  /** Forward pass. Returns the output and stores activations for backprop. */
  forward(input: number[]): number[] {
    this.preActivations = [];
    this.activations = [input.slice()];

    let current = input;

    for (const layer of this.layerStates) {
      const z: number[] = [];
      const a: number[] = [];

      for (let j = 0; j < layer.outputSize; j++) {
        let sum = layer.biases[j];
        for (let i = 0; i < layer.inputSize; i++) {
          sum += current[i] * layer.weights[i][j];
        }
        z.push(sum);
        a.push(applyActivation(sum, layer.activation));
      }

      this.preActivations.push(z);
      this.activations.push(a);
      current = a;
    }

    return current;
  }

  /** Backward pass. Computes gradients via backpropagation. */
  backward(
    target: number[],
    lossFunction: LossFunctionName,
  ): { weightGrads: number[][][]; biasGrads: number[][] } {
    const numLayers = this.layerStates.length;
    const output = this.activations[numLayers];

    // dL/da for the output layer
    const dLoss = computeLossDerivative(output, target, lossFunction);

    // Compute deltas for each layer (reverse order)
    const deltas: number[][] = new Array(numLayers);

    // Output layer delta: dL/dz = dL/da * da/dz
    const outDeltas: number[] = [];
    for (let j = 0; j < this.layerStates[numLayers - 1].outputSize; j++) {
      const dActivation = applyActivationDerivative(
        this.preActivations[numLayers - 1][j],
        this.activations[numLayers][j],
        this.layerStates[numLayers - 1].activation,
      );
      outDeltas.push(dLoss[j] * dActivation);
    }
    deltas[numLayers - 1] = outDeltas;

    // Hidden layer deltas (propagate backwards)
    for (let l = numLayers - 2; l >= 0; l--) {
      const nextLayer = this.layerStates[l + 1];
      const layerDeltas: number[] = [];

      for (let j = 0; j < this.layerStates[l].outputSize; j++) {
        let sum = 0;
        for (let k = 0; k < nextLayer.outputSize; k++) {
          sum += deltas[l + 1][k] * nextLayer.weights[j][k];
        }
        const dActivation = applyActivationDerivative(
          this.preActivations[l][j],
          this.activations[l + 1][j],
          this.layerStates[l].activation,
        );
        layerDeltas.push(sum * dActivation);
      }

      deltas[l] = layerDeltas;
    }

    // Compute weight and bias gradients
    const weightGrads: number[][][] = [];
    const biasGrads: number[][] = [];

    for (let l = 0; l < numLayers; l++) {
      const layerInput = this.activations[l];
      const layer = this.layerStates[l];
      const wGrad: number[][] = [];

      for (let i = 0; i < layer.inputSize; i++) {
        const row: number[] = [];
        for (let j = 0; j < layer.outputSize; j++) {
          row.push(deltas[l][j] * layerInput[i]);
        }
        wGrad.push(row);
      }

      weightGrads.push(wGrad);
      biasGrads.push(deltas[l].slice());
    }

    return { weightGrads, biasGrads };
  }

  /**
   * Train the network on a dataset.
   *
   * Each epoch performs a full pass over all samples, updating
   * weights after each sample (online/stochastic gradient descent).
   * The optimizer handles the actual weight update rule.
   */
  train(dataset: DatasetSample[], options: TrainOptions): void {
    const { epochs, optimizer, lossFunction, onEpoch } = options;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;
      let correct = 0;

      for (const sample of dataset) {
        // Forward
        const output = this.forward(sample.input);

        // Compute loss
        totalLoss += computeLoss(output, sample.target, lossFunction);

        // Accuracy (binary threshold at 0.5)
        if (output.length === 1) {
          const predicted = output[0] >= 0.5 ? 1 : 0;
          if (predicted === sample.target[0]) correct++;
        }

        // Backward
        const { weightGrads, biasGrads } = this.backward(
          sample.target,
          lossFunction,
        );

        // Update weights using optimizer
        for (let l = 0; l < this.layerStates.length; l++) {
          const layer = this.layerStates[l];

          // Flatten weights for optimizer, then unflatten
          const flatWeights = flattenMatrix(layer.weights);
          const flatGrads = flattenMatrix(weightGrads[l]);
          const updatedFlat = optimizer.update(flatWeights, flatGrads);
          unflattenInto(layer.weights, updatedFlat);

          // Update biases
          const updatedBiases = optimizer.update(
            layer.biases,
            biasGrads[l],
          );
          for (let j = 0; j < layer.outputSize; j++) {
            layer.biases[j] = updatedBiases[j];
          }
        }
      }

      if (onEpoch) {
        onEpoch({
          epoch: epoch + 1,
          loss: dataset.length > 0 ? totalLoss / dataset.length : 0,
          accuracy: dataset.length > 0 ? correct / dataset.length : 0,
        });
      }
    }
  }

  /** Predict output for a single input (alias for forward without storing). */
  predict(input: number[]): number[] {
    return this.forward(input);
  }

  /** Serialize all weights and biases for persistence. */
  getWeights(): SerializedWeights {
    return {
      layers: this.layerStates.map((layer) => ({
        weights: layer.weights.map((row) => row.slice()),
        biases: layer.biases.slice(),
      })),
    };
  }

  /** Restore weights and biases from a serialized snapshot. */
  setWeights(serialized: SerializedWeights): void {
    if (serialized.layers.length !== this.layerStates.length) {
      throw new Error(
        `Weight layer count mismatch: got ${serialized.layers.length}, expected ${this.layerStates.length}`,
      );
    }
    for (let l = 0; l < this.layerStates.length; l++) {
      const src = serialized.layers[l];
      const dst = this.layerStates[l];

      if (src.weights.length !== dst.inputSize) {
        throw new Error(`Weight row count mismatch at layer ${l}`);
      }
      for (let i = 0; i < dst.inputSize; i++) {
        if (src.weights[i].length !== dst.outputSize) {
          throw new Error(`Weight column count mismatch at layer ${l}`);
        }
        for (let j = 0; j < dst.outputSize; j++) {
          dst.weights[i][j] = src.weights[i][j];
        }
      }
      if (src.biases.length !== dst.outputSize) {
        throw new Error(`Bias count mismatch at layer ${l}`);
      }
      for (let j = 0; j < dst.outputSize; j++) {
        dst.biases[j] = src.biases[j];
      }
    }
  }

  /** Get the configured layer sizes. */
  getLayerSizes(): number[] {
    return this.layerSizes.slice();
  }

  /** Get the activation function name. */
  getActivation(): ActivationName {
    return this.activationName;
  }

  /** Count total trainable parameters. */
  paramCount(): number {
    let total = 0;
    for (const layer of this.layerStates) {
      total += layer.inputSize * layer.outputSize + layer.outputSize;
    }
    return total;
  }
}

// ── Helpers ──────────────────────────────────────────────────

/** Box-Muller transform for normally distributed random numbers. */
function randomNormal(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
}

/** Flatten a 2D matrix into a 1D array. */
function flattenMatrix(matrix: number[][]): number[] {
  const result: number[] = [];
  for (const row of matrix) {
    for (const val of row) {
      result.push(val);
    }
  }
  return result;
}

/** Write 1D flat array back into an existing 2D matrix in-place. */
function unflattenInto(matrix: number[][], flat: number[]): void {
  let idx = 0;
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      matrix[i][j] = flat[idx++];
    }
  }
}
