// ─────────────────────────────────────────────────────────────
// Architex — ML System Design Module
// ─────────────────────────────────────────────────────────────
//
// Barrel export for the ML playground library:
// - Classification dataset generators (Circle, XOR, Spiral, Gaussian)
// - Simple dense neural network with backpropagation
// ─────────────────────────────────────────────────────────────

// ── Datasets ─────────────────────────────────────────────────
export {
  generateCircle,
  generateXOR,
  generateSpiral,
  generateGaussian,
  DATASET_GENERATORS,
} from "./datasets";
export type { Dataset, DatasetType } from "./datasets";

// ── Neural Network ───────────────────────────────────────────
export { NeuralNetwork } from "./neural-net";
export type { Layer, TrainingState, ActivationType } from "./neural-net";

// ── Pipeline Templates ──────────────────────────────────────
export { PIPELINE_TEMPLATES, STAGE_TYPE_COLORS, STAGE_TYPE_LABELS } from "./pipeline-templates";
export type {
  PipelineStage,
  PipelineStageType,
  MLPipeline,
} from "./pipeline-templates";

// ── Model Serving Patterns ──────────────────────────────────
export {
  simulateABTest,
  simulateCanary,
  simulateShadow,
} from "./serving-patterns";
export type { ServingPattern, ServingStep } from "./serving-patterns";

// ── A/B Testing (MLD-023) ──────────────────────────────────
export { runABTest, calculateSampleSize } from "./ab-testing";
export type { ABTestResult } from "./ab-testing";

// ── Multi-Armed Bandit (MLD-024) ───────────────────────────
export {
  simulateEpsilonGreedy,
  simulateUCB1,
  simulateThompsonSampling,
} from "./multi-armed-bandit";
export type { BanditArm, BanditStep } from "./multi-armed-bandit";

// ── Feature Store (MLD-021) ───────────────────────────────
export { simulateFeatureStore } from "./feature-store";
export type { FeatureStoreState, FeatureStoreStep } from "./feature-store";

// ── CNN Layer Visualization (MLD-014) ─────────────────────
export { simulateConv2D, generateInputGrid, PRESET_FILTERS } from "./cnn-layer";
export type { ConvResult, ConvStep } from "./cnn-layer";

// ── Dropout Visualization (MLD-015) ──────────────────────
export { simulateDropout, simulateInference } from "./dropout-viz";
export type { DropoutState, DropoutNeuron } from "./dropout-viz";

// ── Neural Network Training Engine ──────────────────────────
export { NeuralNetwork as TrainingNeuralNetwork } from "./neural-network";
export type {
  ActivationName,
  LossFunctionName,
  TrainOptions,
  EpochMetrics,
  DatasetSample,
  SerializedWeights,
} from "./neural-network";

// ── Decision Boundary ───────────────────────────────────────
export { computeDecisionBoundary } from "./decision-boundary";
export type { Bounds, DecisionBoundaryResult } from "./decision-boundary";

// ── Activation Functions (standalone) ───────────────────────
export {
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
} from "./activations";

// ── Loss Functions (standalone) ─────────────────────────────
export {
  mse,
  mseDerivative,
  binaryCrossEntropy,
  binaryCrossEntropyDerivative,
  categoricalCrossEntropy,
  categoricalCrossEntropyDerivative,
} from "./loss-functions";

// ── Optimizers ──────────────────────────────────────────────
export { SGDOptimizer, AdamOptimizer, RMSPropOptimizer } from "./optimizers";
export type { Optimizer } from "./optimizers";

// ── CNN Forward Pass Simulation ─────────────────────────────
export {
  simulateCNNForward,
  computeSpatialOutput,
  PRESET_LENET,
  PRESET_SMALL_VGG,
  PRESET_TINY,
} from "./cnn-forward";
export type {
  CNNLayerType,
  CNNLayer,
  Conv2DConfig,
  MaxPoolConfig,
  AvgPoolConfig,
  FlattenConfig,
  DenseConfig,
  TensorDims,
  ForwardStep,
  CNNForwardResult,
} from "./cnn-forward";

// ── Loss Landscape ──────────────────────────────────────────
export {
  computeLossLandscape,
  createLossEvaluator,
  generateSyntheticLandscape,
} from "./loss-landscape";
export type {
  LossLandscapeConfig,
  LossLandscapeResult,
  SimpleLossEvaluatorConfig,
} from "./loss-landscape";

// ── Dataset Generators (standalone) ─────────────────────────
export {
  generateCircleDataset,
  generateXORDataset,
  generateGaussianDataset,
  generateSpiralDataset,
  generateMoonDataset,
} from "./dataset-generators";
export type { DatasetPoint, GeneratedDataset } from "./dataset-generators";
