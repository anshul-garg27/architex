// ─────────────────────────────────────────────────────────────
// Architex — ML Design: Dropout Visualization (MLD-015)
// ─────────────────────────────────────────────────────────────
//
// Educational dropout simulation. Shows neurons randomly
// "dropped" during a forward pass and how the remaining neurons
// are scaled up to compensate (inverted dropout).
// ─────────────────────────────────────────────────────────────

export interface DropoutNeuron {
  id: string;
  active: boolean;
  value: number;
  /** Scaled value after inverted dropout (value / (1 - dropRate) if active, 0 if dropped). */
  scaledValue: number;
}

export interface DropoutState {
  neurons: DropoutNeuron[];
  dropRate: number;
  /** Fraction of neurons that were kept in this sample. */
  keepFraction: number;
}

/**
 * Simulate a single dropout pass on a layer of the given size.
 *
 * Each neuron gets a random activation value in (0, 1) and is then
 * independently dropped with probability `dropRate`. Surviving
 * neurons are scaled by 1/(1 - dropRate) (inverted dropout).
 *
 * @param layerSize  Number of neurons in the layer.
 * @param dropRate   Probability of dropping each neuron (0-1).
 */
export function simulateDropout(
  layerSize: number,
  dropRate: number
): DropoutState {
  const clampedRate = Math.max(0, Math.min(0.99, dropRate));
  const neurons: DropoutNeuron[] = [];
  let keptCount = 0;

  for (let i = 0; i < layerSize; i++) {
    const value = Math.round(Math.random() * 100) / 100;
    const active = Math.random() >= clampedRate;
    if (active) keptCount++;

    neurons.push({
      id: `n-${i}`,
      active,
      value,
      scaledValue: active
        ? Math.round((value / (1 - clampedRate)) * 100) / 100
        : 0,
    });
  }

  return {
    neurons,
    dropRate: clampedRate,
    keepFraction: layerSize > 0 ? keptCount / layerSize : 0,
  };
}

/**
 * Return the same layer without dropout applied (inference mode).
 * All neurons are active and values are unscaled.
 */
export function simulateInference(layerSize: number): DropoutState {
  const neurons: DropoutNeuron[] = [];
  for (let i = 0; i < layerSize; i++) {
    const value = Math.round(Math.random() * 100) / 100;
    neurons.push({
      id: `n-${i}`,
      active: true,
      value,
      scaledValue: value,
    });
  }

  return {
    neurons,
    dropRate: 0,
    keepFraction: 1,
  };
}
