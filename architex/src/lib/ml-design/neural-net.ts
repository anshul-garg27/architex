// ─────────────────────────────────────────────────────────────
// Architex — ML Design: Simple Neural Network (pure TypeScript)
// ─────────────────────────────────────────────────────────────
//
// Educational dense neural network with forward pass and
// backpropagation. Designed for small networks (1-4 layers,
// 1-8 neurons) used in the ML Design module playground.
// ─────────────────────────────────────────────────────────────

export type ActivationType = "relu" | "sigmoid" | "tanh";

export interface Layer {
  neurons: number;
  activation: ActivationType;
  weights: number[][];  // [inputDim][neurons]
  biases: number[];     // [neurons]
}

export interface TrainingState {
  epoch: number;
  loss: number;
  accuracy: number;
  activations: number[][];  // activation per layer for the last sample
}

// ── Activation functions ───────────────────────────────────

function activate(x: number, fn: ActivationType): number {
  switch (fn) {
    case "relu":
      return x > 0 ? x : 0;
    case "sigmoid":
      return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
    case "tanh":
      return Math.tanh(x);
  }
}

function activateDerivative(output: number, fn: ActivationType): number {
  switch (fn) {
    case "relu":
      return output > 0 ? 1 : 0;
    case "sigmoid":
      return output * (1 - output);
    case "tanh":
      return 1 - output * output;
  }
}

// ── Helpers ────────────────────────────────────────────────

function randomWeight(): number {
  // Xavier-like initialization scaled down for small nets
  return (Math.random() - 0.5) * 0.8;
}

// ── NeuralNetwork ──────────────────────────────────────────

export class NeuralNetwork {
  layers: Layer[];

  constructor(layerSizes: number[], activations: ActivationType[]) {
    if (layerSizes.length < 2) {
      throw new Error("Need at least input and output layer sizes");
    }
    if (activations.length !== layerSizes.length - 1) {
      throw new Error(
        "Activations array length must equal number of weight layers (layerSizes.length - 1)"
      );
    }

    this.layers = [];
    for (let i = 0; i < layerSizes.length - 1; i++) {
      const inputDim = layerSizes[i];
      const outputDim = layerSizes[i + 1];
      const weights: number[][] = [];
      for (let j = 0; j < inputDim; j++) {
        const row: number[] = [];
        for (let k = 0; k < outputDim; k++) {
          row.push(randomWeight());
        }
        weights.push(row);
      }
      const biases: number[] = [];
      for (let k = 0; k < outputDim; k++) {
        biases.push(0);
      }
      this.layers.push({
        neurons: outputDim,
        activation: activations[i],
        weights,
        biases,
      });
    }
  }

  /** Forward pass — returns final output and all intermediate activations. */
  forwardFull(input: number[]): { output: number[]; activations: number[][] } {
    const activations: number[][] = [input.slice()];
    let current = input;

    for (const layer of this.layers) {
      const next: number[] = [];
      for (let j = 0; j < layer.neurons; j++) {
        let sum = layer.biases[j];
        for (let i = 0; i < current.length; i++) {
          sum += current[i] * layer.weights[i][j];
        }
        if (isNaN(sum)) sum = 0;
        next.push(activate(sum, layer.activation));
      }
      activations.push(next);
      current = next;
    }

    return { output: current, activations };
  }

  /** Forward pass — returns only the output vector. */
  forward(input: number[]): number[] {
    return this.forwardFull(input).output;
  }

  /**
   * Train the network using mini-batch SGD with backpropagation.
   * Calls onEpoch after each epoch with training metrics.
   * Targets should be arrays of length matching the output layer.
   */
  train(
    inputs: number[][],
    targets: number[][],
    learningRate: number,
    epochs: number,
    onEpoch: (state: TrainingState) => void
  ): void {
    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;
      let correct = 0;
      let lastActivations: number[][] = [];

      for (let s = 0; s < inputs.length; s++) {
        const input = inputs[s];
        const target = targets[s];
        const { activations } = this.forwardFull(input);
        lastActivations = activations;

        const outputLayer = activations[activations.length - 1];

        // Compute loss (MSE) and accuracy
        let sampleLoss = 0;
        for (let j = 0; j < outputLayer.length; j++) {
          const diff = outputLayer[j] - target[j];
          sampleLoss += diff * diff;
        }
        totalLoss += sampleLoss / outputLayer.length;

        // For binary classification: threshold at 0.5
        if (outputLayer.length === 1) {
          const predicted = outputLayer[0] >= 0.5 ? 1 : 0;
          if (predicted === target[0]) correct++;
        }

        // ── Backpropagation ─────────────────────────────

        // Compute deltas for each layer (in reverse)
        const deltas: number[][] = new Array(this.layers.length);

        // Output layer delta
        const outIdx = this.layers.length - 1;
        const outAct = activations[activations.length - 1];
        const outDelta: number[] = [];
        for (let j = 0; j < outAct.length; j++) {
          const error = outAct[j] - target[j];
          let delta = error * activateDerivative(outAct[j], this.layers[outIdx].activation);
          delta = Math.max(-5, Math.min(5, delta));
          outDelta.push(delta);
        }
        deltas[outIdx] = outDelta;

        // Hidden layer deltas
        for (let l = outIdx - 1; l >= 0; l--) {
          const layerAct = activations[l + 1];
          const nextLayer = this.layers[l + 1];
          const layerDelta: number[] = [];
          for (let j = 0; j < layerAct.length; j++) {
            let sum = 0;
            for (let k = 0; k < nextLayer.neurons; k++) {
              sum += deltas[l + 1][k] * nextLayer.weights[j][k];
            }
            let delta = sum * activateDerivative(layerAct[j], this.layers[l].activation);
            delta = Math.max(-5, Math.min(5, delta));
            layerDelta.push(delta);
          }
          deltas[l] = layerDelta;
        }

        // Update weights and biases
        for (let l = 0; l < this.layers.length; l++) {
          const layerInput = activations[l];
          const layer = this.layers[l];
          for (let j = 0; j < layer.neurons; j++) {
            for (let i = 0; i < layerInput.length; i++) {
              layer.weights[i][j] -=
                learningRate * deltas[l][j] * layerInput[i];
            }
            layer.biases[j] -= learningRate * deltas[l][j];
          }
        }
      }

      onEpoch({
        epoch: epoch + 1,
        loss: totalLoss / inputs.length,
        accuracy: inputs.length > 0 ? correct / inputs.length : 0,
        activations: lastActivations,
      });
    }
  }

  /** Count total trainable parameters. */
  paramCount(): number {
    let total = 0;
    for (const layer of this.layers) {
      // weights: inputDim * neurons, biases: neurons
      const inputDim = layer.weights.length;
      total += inputDim * layer.neurons + layer.neurons;
    }
    return total;
  }
}
