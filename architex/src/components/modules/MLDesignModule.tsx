"use client";

import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  Brain,
  Play,
  RotateCcw,
  Loader2,
  Workflow,
  Server,
  ChevronDown,
  FlaskConical,
  Dices,
  Database,
  Layers,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NeuralNetwork,
  DATASET_GENERATORS,
  PIPELINE_TEMPLATES,
  STAGE_TYPE_COLORS,
  STAGE_TYPE_LABELS,
  simulateABTest,
  simulateCanary,
  simulateShadow,
  runABTest,
  calculateSampleSize,
  simulateEpsilonGreedy,
  simulateUCB1,
  simulateThompsonSampling,
  simulateFeatureStore,
  simulateConv2D,
  generateInputGrid,
  PRESET_FILTERS,
  simulateDropout,
  simulateInference,
} from "@/lib/ml-design";
import type {
  Dataset,
  DatasetType,
  ActivationType,
  TrainingState,
  MLPipeline,
  PipelineStage,
  ServingPattern,
  ABTestResult,
  BanditStep,
  FeatureStoreStep,
  ConvResult,
  DropoutState,
} from "@/lib/ml-design";

// ── Types ─────────────────────────────────────────────────────

type ModuleMode = "neural-network" | "pipeline-builder" | "model-serving" | "ab-testing" | "experimentation" | "feature-store";
type ServingMode = "ab-test" | "canary" | "shadow";
type BanditStrategy = "epsilon-greedy" | "ucb1" | "thompson-sampling";

// ── Constants ──────────────────────────────────────────────
const DATASET_OPTIONS: { value: DatasetType; label: string }[] = [
  { value: "circle", label: "Circle" },
  { value: "xor", label: "XOR" },
  { value: "spiral", label: "Spiral" },
  { value: "gaussian", label: "Gaussian" },
];

const ACTIVATION_OPTIONS: { value: ActivationType; label: string }[] = [
  { value: "relu", label: "ReLU" },
  { value: "sigmoid", label: "Sigmoid" },
  { value: "tanh", label: "Tanh" },
];

const DATASET_SAMPLE_COUNT = 200;
const GRID_RESOLUTION = 30;

const MODE_TABS: { value: ModuleMode; label: string; Icon: typeof Brain }[] = [
  { value: "neural-network", label: "Neural Network", Icon: Brain },
  { value: "pipeline-builder", label: "Pipeline Builder", Icon: Workflow },
  { value: "model-serving", label: "Model Serving", Icon: Server },
  { value: "ab-testing", label: "A/B Testing", Icon: FlaskConical },
  { value: "experimentation", label: "Experimentation", Icon: Dices },
  { value: "feature-store", label: "Feature Store", Icon: Database },
];

// ══════════════════════════════════════════════════════════════
// NEURAL NETWORK MODE — Sidebar
// ══════════════════════════════════════════════════════════════

interface NNSidebarProps {
  datasetType: DatasetType;
  onDatasetChange: (d: DatasetType) => void;
  layerCount: number;
  onLayerCountChange: (n: number) => void;
  neuronsPerLayer: number;
  onNeuronsChange: (n: number) => void;
  activation: ActivationType;
  onActivationChange: (a: ActivationType) => void;
  learningRate: number;
  onLearningRateChange: (lr: number) => void;
  epochs: number;
  onEpochsChange: (e: number) => void;
  onTrain: () => void;
  onReset: () => void;
  isTraining: boolean;
}

const NNSidebarContent = memo(function NNSidebarContent(props: NNSidebarProps) {
  const {
    datasetType,
    onDatasetChange,
    layerCount,
    onLayerCountChange,
    neuronsPerLayer,
    onNeuronsChange,
    activation,
    onActivationChange,
    learningRate,
    onLearningRateChange,
    epochs,
    onEpochsChange,
    onTrain,
    onReset,
    isTraining,
  } = props;

  const lrToSlider = (lr: number) => {
    const minLog = Math.log10(0.001);
    const maxLog = Math.log10(1.0);
    return Math.round(((Math.log10(lr) - minLog) / (maxLog - minLog)) * 100);
  };
  const sliderToLr = (v: number) => {
    const minLog = Math.log10(0.001);
    const maxLog = Math.log10(1.0);
    return Math.pow(10, minLog + (v / 100) * (maxLog - minLog));
  };

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
      {/* Dataset */}
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          Dataset
        </label>
        <div className="grid grid-cols-2 gap-1">
          {DATASET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onDatasetChange(opt.value)}
              disabled={isTraining}
              className={cn(
                "rounded px-2 py-1.5 text-xs font-medium transition-colors",
                datasetType === opt.value
                  ? "bg-accent text-foreground"
                  : "bg-elevated text-foreground-muted hover:bg-accent/50",
                isTraining && "cursor-not-allowed opacity-50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Layer Count */}
      <div>
        <label className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          <span>Hidden Layers</span>
          <span className="text-foreground">{layerCount}</span>
        </label>
        <input
          type="range"
          min={1}
          max={4}
          step={1}
          value={layerCount}
          onChange={(e) => onLayerCountChange(Number(e.target.value))}
          disabled={isTraining}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Neurons per Layer */}
      <div>
        <label className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          <span>Neurons / Layer</span>
          <span className="text-foreground">{neuronsPerLayer}</span>
        </label>
        <input
          type="range"
          min={1}
          max={8}
          step={1}
          value={neuronsPerLayer}
          onChange={(e) => onNeuronsChange(Number(e.target.value))}
          disabled={isTraining}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Activation */}
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          Activation
        </label>
        <div className="flex gap-1">
          {ACTIVATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onActivationChange(opt.value)}
              disabled={isTraining}
              className={cn(
                "flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors",
                activation === opt.value
                  ? "bg-accent text-foreground"
                  : "bg-elevated text-foreground-muted hover:bg-accent/50",
                isTraining && "cursor-not-allowed opacity-50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Learning Rate */}
      <div>
        <label className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          <span>Learning Rate</span>
          <span className="text-foreground">{learningRate.toFixed(4)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={lrToSlider(learningRate)}
          onChange={(e) => onLearningRateChange(sliderToLr(Number(e.target.value)))}
          disabled={isTraining}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Epochs */}
      <div>
        <label className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          <span>Epochs</span>
          <span className="text-foreground">{epochs}</span>
        </label>
        <input
          type="range"
          min={10}
          max={1000}
          step={10}
          value={epochs}
          onChange={(e) => onEpochsChange(Number(e.target.value))}
          disabled={isTraining}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onTrain}
          disabled={isTraining}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors",
            isTraining
              ? "cursor-not-allowed bg-blue-800/40 text-blue-300"
              : "bg-blue-600 text-white hover:bg-blue-500"
          )}
        >
          {isTraining ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {isTraining ? "Training..." : "Train"}
        </button>
        <button
          onClick={onReset}
          disabled={isTraining}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
            isTraining
              ? "cursor-not-allowed bg-elevated/50 text-foreground-subtle"
              : "bg-elevated text-foreground-muted hover:bg-accent hover:text-foreground"
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// PIPELINE BUILDER MODE — Sidebar
// ══════════════════════════════════════════════════════════════

interface PipelineSidebarProps {
  selectedPipeline: MLPipeline;
  onPipelineChange: (id: string) => void;
  selectedStage: PipelineStage | null;
  onStageSelect: (stage: PipelineStage | null) => void;
}

const PipelineSidebarContent = memo(function PipelineSidebarContent({
  selectedPipeline,
  onPipelineChange,
  selectedStage,
  onStageSelect,
}: PipelineSidebarProps) {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
      {/* Template Selector */}
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          Pipeline Template
        </label>
        <div className="relative">
          <select
            value={selectedPipeline.id}
            onChange={(e) => {
              onPipelineChange(e.target.value);
              onStageSelect(null);
            }}
            className="w-full appearance-none rounded border border-border bg-elevated px-2 py-1.5 pr-7 text-xs text-foreground focus:border-blue-500 focus:outline-none"
          >
            {PIPELINE_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-foreground-muted" />
        </div>
      </div>

      {/* Pipeline Description */}
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          Description
        </label>
        <p className="text-xs leading-relaxed text-foreground-muted">
          {selectedPipeline.description}
        </p>
      </div>

      {/* Stage List */}
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          Stages ({selectedPipeline.stages.length})
        </label>
        <div className="space-y-1">
          {selectedPipeline.stages.map((stage) => (
            <button
              key={stage.id}
              onClick={() =>
                onStageSelect(selectedStage?.id === stage.id ? null : stage)
              }
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors",
                selectedStage?.id === stage.id
                  ? "bg-accent text-foreground"
                  : "bg-elevated text-foreground-muted hover:bg-accent/50"
              )}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: STAGE_TYPE_COLORS[stage.type] }}
              />
              <span className="truncate">{stage.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          Stage Types
        </label>
        <div className="space-y-1">
          {(Object.keys(STAGE_TYPE_COLORS) as Array<keyof typeof STAGE_TYPE_COLORS>).map(
            (type) => (
              <div key={type} className="flex items-center gap-2 text-[10px] text-foreground-muted">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: STAGE_TYPE_COLORS[type] }}
                />
                {STAGE_TYPE_LABELS[type]}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// MODEL SERVING MODE — Sidebar
// ══════════════════════════════════════════════════════════════

interface ServingSidebarProps {
  servingMode: ServingMode;
  onServingModeChange: (m: ServingMode) => void;
  abSplit: number;
  onAbSplitChange: (v: number) => void;
  pattern: ServingPattern;
}

const ServingSidebarContent = memo(function ServingSidebarContent({
  servingMode,
  onServingModeChange,
  abSplit,
  onAbSplitChange,
  pattern,
}: ServingSidebarProps) {
  const servingModes: { value: ServingMode; label: string }[] = [
    { value: "ab-test", label: "A/B Test" },
    { value: "canary", label: "Canary" },
    { value: "shadow", label: "Shadow" },
  ];

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
      {/* Pattern Selector */}
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          Serving Pattern
        </label>
        <div className="flex gap-1">
          {servingModes.map((m) => (
            <button
              key={m.value}
              onClick={() => onServingModeChange(m.value)}
              className={cn(
                "flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors",
                servingMode === m.value
                  ? "bg-accent text-foreground"
                  : "bg-elevated text-foreground-muted hover:bg-accent/50"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* A/B Split slider (only for A/B test) */}
      {servingMode === "ab-test" && (
        <div>
          <label className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            <span>Traffic to Model B</span>
            <span className="text-foreground">{abSplit}%</span>
          </label>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={abSplit}
            onChange={(e) => onAbSplitChange(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
      )}

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          Description
        </label>
        <p className="text-xs leading-relaxed text-foreground-muted">
          {pattern.description}
        </p>
      </div>

      {/* Traffic Split */}
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          Traffic Split
        </label>
        <div className="space-y-1.5">
          {Object.entries(pattern.trafficSplit).map(([model, pct]) => (
            <div key={model}>
              <div className="flex items-center justify-between text-[10px] text-foreground-muted">
                <span className="truncate">{model}</span>
                <span className="font-mono text-foreground">{pct}%</span>
              </div>
              <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    backgroundColor: model.includes("B") || model.includes("New") || model.includes("Shadow")
                      ? "#f97316"
                      : "#3b82f6",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// A/B TESTING MODE — Sidebar
// ══════════════════════════════════════════════════════════════

interface ABTestingSidebarProps {
  controlRate: number;
  onControlRateChange: (v: number) => void;
  treatmentRate: number;
  onTreatmentRateChange: (v: number) => void;
  sampleSize: number;
  onSampleSizeChange: (v: number) => void;
  onRunTest: () => void;
  result: ABTestResult | null;
}

const ABTestingSidebarContent = memo(function ABTestingSidebarContent({
  controlRate,
  onControlRateChange,
  treatmentRate,
  onTreatmentRateChange,
  sampleSize,
  onSampleSizeChange,
  onRunTest,
  result,
}: ABTestingSidebarProps) {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
      {/* Control Rate */}
      <div>
        <label className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          <span>Control Rate</span>
          <span className="text-foreground">{(controlRate * 100).toFixed(1)}%</span>
        </label>
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={Math.round(controlRate * 100)}
          onChange={(e) => onControlRateChange(Number(e.target.value) / 100)}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Treatment Rate */}
      <div>
        <label className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          <span>Treatment Rate</span>
          <span className="text-foreground">{(treatmentRate * 100).toFixed(1)}%</span>
        </label>
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={Math.round(treatmentRate * 100)}
          onChange={(e) => onTreatmentRateChange(Number(e.target.value) / 100)}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Sample Size */}
      <div>
        <label className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          <span>Sample Size</span>
          <span className="text-foreground">{sampleSize.toLocaleString()}</span>
        </label>
        <input
          type="range"
          min={100}
          max={50000}
          step={100}
          value={sampleSize}
          onChange={(e) => onSampleSizeChange(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Run Test Button */}
      <div className="pt-2">
        <button
          onClick={onRunTest}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
        >
          <Play className="h-3.5 w-3.5" />
          Run Test
        </button>
      </div>

      {/* Required Sample Size hint */}
      {result && (
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Required Sample Size
          </label>
          <p className="text-xs font-mono text-foreground">
            {result.requiredSampleSize.toLocaleString()} per variant
          </p>
          <p className="mt-0.5 text-[10px] text-foreground-subtle">
            (80% power, 5% significance)
          </p>
        </div>
      )}
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// EXPERIMENTATION (BANDIT) MODE — Sidebar
// ══════════════════════════════════════════════════════════════

interface BanditSidebarProps {
  strategy: BanditStrategy;
  onStrategyChange: (s: BanditStrategy) => void;
  armCount: number;
  onArmCountChange: (n: number) => void;
  rounds: number;
  onRoundsChange: (n: number) => void;
  epsilon: number;
  onEpsilonChange: (e: number) => void;
  onRun: () => void;
  isRunning: boolean;
}

const BanditSidebarContent = memo(function BanditSidebarContent({
  strategy,
  onStrategyChange,
  armCount,
  onArmCountChange,
  rounds,
  onRoundsChange,
  epsilon,
  onEpsilonChange,
  onRun,
  isRunning,
}: BanditSidebarProps) {
  const strategies: { value: BanditStrategy; label: string }[] = [
    { value: "epsilon-greedy", label: "Epsilon-Greedy" },
    { value: "ucb1", label: "UCB1" },
    { value: "thompson-sampling", label: "Thompson" },
  ];

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
      {/* Strategy Selector */}
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          Strategy
        </label>
        <div className="flex gap-1">
          {strategies.map((s) => (
            <button
              key={s.value}
              onClick={() => onStrategyChange(s.value)}
              disabled={isRunning}
              className={cn(
                "flex-1 rounded px-1.5 py-1.5 text-[10px] font-medium transition-colors",
                strategy === s.value
                  ? "bg-accent text-foreground"
                  : "bg-elevated text-foreground-muted hover:bg-accent/50",
                isRunning && "cursor-not-allowed opacity-50"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Arm Count */}
      <div>
        <label className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          <span>Arms</span>
          <span className="text-foreground">{armCount}</span>
        </label>
        <input
          type="range"
          min={2}
          max={8}
          step={1}
          value={armCount}
          onChange={(e) => onArmCountChange(Number(e.target.value))}
          disabled={isRunning}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Rounds */}
      <div>
        <label className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          <span>Rounds</span>
          <span className="text-foreground">{rounds}</span>
        </label>
        <input
          type="range"
          min={50}
          max={500}
          step={10}
          value={rounds}
          onChange={(e) => onRoundsChange(Number(e.target.value))}
          disabled={isRunning}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Epsilon (only for epsilon-greedy) */}
      {strategy === "epsilon-greedy" && (
        <div>
          <label className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            <span>Epsilon</span>
            <span className="text-foreground">{epsilon.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={1}
            max={50}
            step={1}
            value={Math.round(epsilon * 100)}
            onChange={(e) => onEpsilonChange(Number(e.target.value) / 100)}
            disabled={isRunning}
            className="w-full accent-blue-500"
          />
        </div>
      )}

      {/* Run Button */}
      <div className="pt-2">
        <button
          onClick={onRun}
          disabled={isRunning}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors",
            isRunning
              ? "cursor-not-allowed bg-blue-800/40 text-blue-300"
              : "bg-blue-600 text-white hover:bg-blue-500"
          )}
        >
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {isRunning ? "Running..." : "Run Simulation"}
        </button>
      </div>

      {/* Strategy Description */}
      <div>
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          About
        </label>
        <p className="text-xs leading-relaxed text-foreground-muted">
          {strategy === "epsilon-greedy"
            ? `Explores randomly with probability epsilon (${epsilon.toFixed(2)}), otherwise exploits the best known arm.`
            : strategy === "ucb1"
              ? "Balances exploration and exploitation using an upper confidence bound on each arm's estimated value."
              : "Samples from a Beta posterior for each arm and selects the arm with the highest sample, naturally balancing explore vs exploit."}
        </p>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// FEATURE STORE MODE — Sidebar
// ══════════════════════════════════════════════════════════════

interface FeatureStoreSidebarProps {
  steps: FeatureStoreStep[];
  animTick: number;
  isRunning: boolean;
  onRun: () => void;
  onReset: () => void;
}

const FeatureStoreSidebarContent = memo(function FeatureStoreSidebarContent({
  steps,
  animTick,
  isRunning,
  onRun,
  onReset,
}: FeatureStoreSidebarProps) {
  const stepIdx = steps.length > 0 ? Math.min(animTick, steps.length - 1) : -1;
  const currentStep = stepIdx >= 0 ? steps[stepIdx] : null;

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
      {/* Architecture Overview */}
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          Architecture
        </label>
        <p className="text-xs leading-relaxed text-foreground-muted">
          Dual-store feature serving: Redis for online (&lt;5ms), S3/Parquet for offline
          (point-in-time training). Batch + stream computation pipelines.
        </p>
      </div>

      {/* Run / Reset Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onRun}
          disabled={isRunning}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors",
            isRunning
              ? "cursor-not-allowed bg-blue-800/40 text-blue-300"
              : "bg-blue-600 text-white hover:bg-blue-500"
          )}
        >
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {isRunning ? "Running..." : "Run"}
        </button>
        <button
          onClick={onReset}
          disabled={isRunning}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
            isRunning
              ? "cursor-not-allowed bg-elevated/50 text-foreground-subtle"
              : "bg-elevated text-foreground-muted hover:bg-accent hover:text-foreground"
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      {/* Current Step */}
      {currentStep && (
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Current Step
          </label>
          <div className="rounded border border-border bg-elevated px-2 py-1.5">
            <p className="text-[10px] font-mono text-foreground">
              {currentStep.tick} / {steps.length}
            </p>
            <p className="mt-0.5 text-[10px] text-foreground-muted">{currentStep.action}</p>
          </div>
        </div>
      )}

      {/* Pipeline Status */}
      {currentStep && (
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Pipelines
          </label>
          <div className="space-y-1">
            {currentStep.state.computationPipeline.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between rounded bg-elevated px-2 py-1"
              >
                <span className="flex items-center gap-1.5 text-[10px] text-foreground-muted">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: p.type === "stream" ? "#3b82f6" : "#8b5cf6",
                    }}
                  />
                  {p.name}
                </span>
                <span
                  className="text-[10px] font-mono"
                  style={{
                    color: p.status === "running" ? "#f97316" : "#4ade80",
                  }}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store Stats */}
      {currentStep && (
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Store Stats
          </label>
          <div className="space-y-1">
            <div className="flex items-center justify-between rounded bg-elevated px-2 py-1">
              <span className="text-[10px] text-foreground-muted">Online (Redis)</span>
              <span className="text-[10px] font-mono text-foreground">
                {currentStep.state.onlineStore.length} keys
              </span>
            </div>
            <div className="flex items-center justify-between rounded bg-elevated px-2 py-1">
              <span className="text-[10px] text-foreground-muted">Offline (S3)</span>
              <span className="text-[10px] font-mono text-foreground">
                {currentStep.state.offlineStore.length} records
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// UNIFIED SIDEBAR (tab switcher + mode content)
// ══════════════════════════════════════════════════════════════

interface MLSidebarProps {
  mode: ModuleMode;
  onModeChange: (m: ModuleMode) => void;
  // NN props
  nnProps: NNSidebarProps;
  // Pipeline props
  pipelineProps: PipelineSidebarProps;
  // Serving props
  servingProps: ServingSidebarProps;
  // A/B Testing props
  abTestingProps: ABTestingSidebarProps;
  // Bandit props
  banditProps: BanditSidebarProps;
  // Feature Store props
  featureStoreProps: FeatureStoreSidebarProps;
}

const MLSidebar = memo(function MLSidebar({
  mode,
  onModeChange,
  nnProps,
  pipelineProps,
  servingProps,
  abTestingProps,
  banditProps,
  featureStoreProps,
}: MLSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          ML Playground
        </h2>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-sidebar-border">
        {MODE_TABS.map(({ value, label, Icon }) => (
          <button
            key={value}
            onClick={() => onModeChange(value)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[9px] font-medium uppercase tracking-wider transition-colors",
              mode === value
                ? "border-b-2 border-blue-500 text-foreground"
                : "text-foreground-muted hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Mode-specific Content */}
      {mode === "neural-network" && <NNSidebarContent {...nnProps} />}
      {mode === "pipeline-builder" && <PipelineSidebarContent {...pipelineProps} />}
      {mode === "model-serving" && <ServingSidebarContent {...servingProps} />}
      {mode === "ab-testing" && <ABTestingSidebarContent {...abTestingProps} />}
      {mode === "experimentation" && <BanditSidebarContent {...banditProps} />}
      {mode === "feature-store" && <FeatureStoreSidebarContent {...featureStoreProps} />}
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// NEURAL NETWORK CANVAS components (unchanged)
// ══════════════════════════════════════════════════════════════

const ScatterPlot = memo(function ScatterPlot({
  dataset,
  width,
  height,
}: {
  dataset: Dataset;
  width: number;
  height: number;
}) {
  const pad = 10;
  const w = width - 2 * pad;
  const h = height - 2 * pad;

  return (
    <svg width={width} height={height} className="block">
      <rect width={width} height={height} fill="transparent" />
      {dataset.points.map(([x, y], i) => {
        const sx = pad + ((x + 1) / 2) * w;
        const sy = pad + ((1 - (y + 1) / 2)) * h;
        return (
          <circle
            key={i}
            cx={sx}
            cy={sy}
            r={2.5}
            fill={dataset.labels[i] === 1 ? "#f97316" : "#3b82f6"}
            opacity={0.8}
          />
        );
      })}
    </svg>
  );
});

interface NetworkDiagramProps {
  layerSizes: number[];
  network: NeuralNetwork | null;
  width: number;
  height: number;
}

const NetworkDiagram = memo(function NetworkDiagram({
  layerSizes,
  network,
  width,
  height,
}: NetworkDiagramProps) {
  const pad = 20;
  const colCount = layerSizes.length;
  const colSpacing = (width - 2 * pad) / Math.max(colCount - 1, 1);
  const maxNeurons = Math.max(...layerSizes, 1);
  const neuronRadius = Math.min(12, (height - 2 * pad) / (maxNeurons * 3));

  const positions: { x: number; y: number }[][] = layerSizes.map((size, col) => {
    const x = pad + col * colSpacing;
    const totalH = size * neuronRadius * 3;
    const startY = (height - totalH) / 2 + neuronRadius * 1.5;
    return Array.from({ length: size }, (_, row) => ({
      x,
      y: startY + row * neuronRadius * 3,
    }));
  });

  let maxW = 0.01;
  if (network) {
    for (const layer of network.layers) {
      for (const row of layer.weights) {
        for (const w of row) {
          maxW = Math.max(maxW, Math.abs(w));
        }
      }
    }
  }

  return (
    <svg width={width} height={height} className="block">
      {positions.map((col, colIdx) => {
        if (colIdx === 0) return null;
        const prevCol = positions[colIdx - 1];
        return prevCol.map((from, fi) =>
          col.map((to, ti) => {
            let weight = 0;
            if (network && network.layers[colIdx - 1]) {
              const layerWeights = network.layers[colIdx - 1].weights;
              if (layerWeights[fi] && layerWeights[fi][ti] !== undefined) {
                weight = layerWeights[fi][ti];
              }
            }
            const norm = Math.abs(weight) / maxW;
            const color = weight >= 0 ? `rgba(59,130,246,${0.15 + norm * 0.85})` : `rgba(249,115,22,${0.15 + norm * 0.85})`;
            const strokeW = 0.5 + norm * 2.5;
            return (
              <line
                key={`${colIdx}-${fi}-${ti}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={color}
                strokeWidth={strokeW}
              />
            );
          })
        );
      })}
      {positions.map((col, colIdx) =>
        col.map((pos, ni) => (
          <circle
            key={`n-${colIdx}-${ni}`}
            cx={pos.x}
            cy={pos.y}
            r={neuronRadius}
            fill="#1e293b"
            stroke={
              colIdx === 0
                ? "#3b82f6"
                : colIdx === positions.length - 1
                  ? "#f97316"
                  : "#64748b"
            }
            strokeWidth={1.5}
          />
        ))
      )}
      {positions.map((col, colIdx) => {
        const label =
          colIdx === 0
            ? "Input"
            : colIdx === positions.length - 1
              ? "Output"
              : `H${colIdx}`;
        return (
          <text
            key={`label-${colIdx}`}
            x={col[0]?.x ?? 0}
            y={height - 4}
            textAnchor="middle"
            className="fill-foreground-muted text-[9px]"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
});

interface HeatmapProps {
  network: NeuralNetwork | null;
  dataset: Dataset;
  width: number;
  height: number;
}

const DecisionBoundary = memo(function DecisionBoundary({
  network,
  dataset,
  width,
  height,
}: HeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const res = GRID_RESOLUTION;

    if (network) {
      const cellW = width / res;
      const cellH = height / res;
      for (let gx = 0; gx < res; gx++) {
        for (let gy = 0; gy < res; gy++) {
          const x = (gx / (res - 1)) * 2 - 1;
          const y = 1 - (gy / (res - 1)) * 2;
          const out = network.forward([x, y]);
          const p = Math.max(0, Math.min(1, out[0]));
          const r = Math.round(59 + p * (249 - 59));
          const g = Math.round(130 + p * (115 - 130));
          const b = Math.round(246 + p * (22 - 246));
          ctx.fillStyle = `rgba(${r},${g},${b},0.35)`;
          ctx.fillRect(gx * cellW, gy * cellH, cellW + 1, cellH + 1);
        }
      }
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    for (let i = 0; i < dataset.points.length; i++) {
      const [px, py] = dataset.points[i];
      const sx = ((px + 1) / 2) * width;
      const sy = ((1 - (py + 1) / 2)) * height;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = dataset.labels[i] === 1 ? "#f97316" : "#3b82f6";
      ctx.fill();
    }
  }, [network, dataset, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="block"
    />
  );
});

// ══════════════════════════════════════════════════════════════
// CNN DEMO PANEL (MLD-014)
// ══════════════════════════════════════════════════════════════

type FilterPreset = "edge" | "sharpen" | "blur";

const CNNDemoPanel = memo(function CNNDemoPanel() {
  const [filterPreset, setFilterPreset] = useState<FilterPreset>("edge");
  const [stride, setStride] = useState(1);
  const [convResult, setConvResult] = useState<ConvResult | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const handleRun = useCallback(() => {
    const input = generateInputGrid(8, 8);
    const filter = PRESET_FILTERS[filterPreset];
    const result = simulateConv2D(input, filter, stride);
    setConvResult(result);
    setActiveStep(0);
  }, [filterPreset, stride]);

  // Auto-run on mount
  useEffect(() => {
    handleRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = convResult?.steps[activeStep];
  const cellSize = 28;

  return (
    <div className="rounded-lg border border-border bg-elevated/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          CNN 2D Convolution Demo
        </h4>
        <div className="flex items-center gap-2">
          <select
            value={filterPreset}
            onChange={(e) => setFilterPreset(e.target.value as FilterPreset)}
            className="rounded bg-background px-2 py-1 text-xs text-foreground"
          >
            <option value="edge">Edge Detect</option>
            <option value="sharpen">Sharpen</option>
            <option value="blur">Blur</option>
          </select>
          <select
            value={stride}
            onChange={(e) => setStride(Number(e.target.value))}
            className="rounded bg-background px-2 py-1 text-xs text-foreground"
          >
            <option value={1}>Stride 1</option>
            <option value={2}>Stride 2</option>
          </select>
          <button
            onClick={handleRun}
            className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-500"
          >
            Regenerate
          </button>
        </div>
      </div>

      {convResult && (
        <div className="flex items-start gap-4">
          {/* Input Grid */}
          <div>
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Input (8x8)
            </span>
            <svg
              width={cellSize * 8}
              height={cellSize * 8}
              className="block rounded border border-border"
            >
              {convResult.inputGrid.map((row, r) =>
                row.map((val, c) => {
                  const isInWindow =
                    step &&
                    r >= step.row * stride &&
                    r < step.row * stride + 3 &&
                    c >= step.col * stride &&
                    c < step.col * stride + 3;
                  return (
                    <g key={`${r}-${c}`}>
                      <rect
                        x={c * cellSize}
                        y={r * cellSize}
                        width={cellSize}
                        height={cellSize}
                        fill={
                          isInWindow
                            ? "rgba(59, 130, 246, 0.3)"
                            : `rgba(255, 255, 255, ${val})`
                        }
                        stroke={isInWindow ? "#3b82f6" : "#334155"}
                        strokeWidth={isInWindow ? 1.5 : 0.5}
                      />
                      <text
                        x={c * cellSize + cellSize / 2}
                        y={r * cellSize + cellSize / 2 + 3}
                        textAnchor="middle"
                        fontSize={8}
                        fill="#94a3b8"
                      >
                        {val.toFixed(1)}
                      </text>
                    </g>
                  );
                })
              )}
            </svg>
          </div>

          {/* Filter */}
          <div>
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Filter (3x3)
            </span>
            <svg
              width={cellSize * 3}
              height={cellSize * 3}
              className="block rounded border border-border"
            >
              {convResult.filters[0].map((row, r) =>
                row.map((val, c) => (
                  <g key={`f-${r}-${c}`}>
                    <rect
                      x={c * cellSize}
                      y={r * cellSize}
                      width={cellSize}
                      height={cellSize}
                      fill={val > 0 ? `rgba(34, 197, 94, ${Math.min(Math.abs(val) / 8, 0.6)})` : `rgba(239, 68, 68, ${Math.min(Math.abs(val) / 8, 0.6)})`}
                      stroke="#334155"
                      strokeWidth={0.5}
                    />
                    <text
                      x={c * cellSize + cellSize / 2}
                      y={r * cellSize + cellSize / 2 + 3}
                      textAnchor="middle"
                      fontSize={8}
                      fill="#e2e8f0"
                    >
                      {Number.isInteger(val) ? val : val.toFixed(2)}
                    </text>
                  </g>
                ))
              )}
            </svg>
          </div>

          {/* Output Grid */}
          <div>
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Output ({convResult.outputGrid.length}x{convResult.outputGrid[0]?.length ?? 0})
            </span>
            <svg
              width={cellSize * (convResult.outputGrid[0]?.length ?? 1)}
              height={cellSize * convResult.outputGrid.length}
              className="block rounded border border-border"
            >
              {convResult.outputGrid.map((row, r) =>
                row.map((val, c) => {
                  const isActive = step && step.row === r && step.col === c;
                  const absVal = Math.abs(val);
                  const maxAbs = Math.max(
                    ...convResult.outputGrid.flat().map((v) => Math.abs(v)),
                    1
                  );
                  const intensity = absVal / maxAbs;
                  return (
                    <g key={`o-${r}-${c}`}>
                      <rect
                        x={c * cellSize}
                        y={r * cellSize}
                        width={cellSize}
                        height={cellSize}
                        fill={
                          isActive
                            ? "rgba(234, 179, 8, 0.4)"
                            : val >= 0
                              ? `rgba(59, 130, 246, ${intensity * 0.6})`
                              : `rgba(239, 68, 68, ${intensity * 0.6})`
                        }
                        stroke={isActive ? "#eab308" : "#334155"}
                        strokeWidth={isActive ? 1.5 : 0.5}
                      />
                      <text
                        x={c * cellSize + cellSize / 2}
                        y={r * cellSize + cellSize / 2 + 3}
                        textAnchor="middle"
                        fontSize={7}
                        fill="#e2e8f0"
                      >
                        {val.toFixed(1)}
                      </text>
                    </g>
                  );
                })
              )}
            </svg>
          </div>
        </div>
      )}

      {/* Step scrubber */}
      {convResult && convResult.steps.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-foreground-muted">Step</span>
            <input
              type="range"
              min={0}
              max={convResult.steps.length - 1}
              value={activeStep}
              onChange={(e) => setActiveStep(Number(e.target.value))}
              className="flex-1 accent-blue-500"
            />
            <span className="font-mono text-[10px] text-foreground-muted">
              {activeStep + 1}/{convResult.steps.length}
            </span>
          </div>
          {step && (
            <p className="mt-1 text-[10px] text-foreground-subtle">{step.description}</p>
          )}
        </div>
      )}
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// DROPOUT DEMO PANEL (MLD-015)
// ══════════════════════════════════════════════════════════════

const DropoutDemoPanel = memo(function DropoutDemoPanel() {
  const [layerSize, setLayerSize] = useState(16);
  const [dropRate, setDropRate] = useState(0.3);
  const [dropoutEnabled, setDropoutEnabled] = useState(true);
  const [dropoutState, setDropoutState] = useState<DropoutState | null>(null);

  const handleResample = useCallback(() => {
    if (dropoutEnabled) {
      setDropoutState(simulateDropout(layerSize, dropRate));
    } else {
      setDropoutState(simulateInference(layerSize));
    }
  }, [layerSize, dropRate, dropoutEnabled]);

  // Auto-run on mount and when params change
  useEffect(() => {
    handleResample();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerSize, dropRate, dropoutEnabled]);

  const neuronR = 14;
  const gap = 6;
  const cols = Math.min(layerSize, 8);
  const rows = Math.ceil(layerSize / cols);
  const svgW = cols * (neuronR * 2 + gap) + gap;
  const svgH = rows * (neuronR * 2 + gap) + gap + 24;

  return (
    <div className="rounded-lg border border-border bg-elevated/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Dropout Visualization
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDropoutEnabled(!dropoutEnabled)}
            className={cn(
              "rounded px-2 py-1 text-xs font-medium transition-colors",
              dropoutEnabled
                ? "bg-amber-600 text-white hover:bg-amber-500"
                : "bg-green-600 text-white hover:bg-green-500"
            )}
          >
            {dropoutEnabled ? "Training (Dropout ON)" : "Inference (Dropout OFF)"}
          </button>
          <button
            onClick={handleResample}
            className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-500"
          >
            Resample
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-2 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-foreground-muted">Neurons:</span>
          <input
            type="range"
            min={4}
            max={32}
            step={1}
            value={layerSize}
            onChange={(e) => setLayerSize(Number(e.target.value))}
            className="w-20 accent-blue-500"
          />
          <span className="font-mono text-[10px] text-foreground">{layerSize}</span>
        </div>
        {dropoutEnabled && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-foreground-muted">Drop Rate:</span>
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={Math.round(dropRate * 100)}
              onChange={(e) => setDropRate(Number(e.target.value) / 100)}
              className="w-20 accent-blue-500"
            />
            <span className="font-mono text-[10px] text-foreground">{(dropRate * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Neuron grid visualization */}
      {dropoutState && (
        <div>
          <svg width={svgW} height={svgH} className="block">
            {/* Mode label */}
            <text x={svgW / 2} y={14} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight="bold">
              {dropoutEnabled
                ? `Training — ${Math.round(dropoutState.keepFraction * 100)}% neurons active`
                : "Inference — all neurons active"}
            </text>
            {dropoutState.neurons.map((neuron, idx) => {
              const col = idx % cols;
              const row = Math.floor(idx / cols);
              const cx = gap + neuronR + col * (neuronR * 2 + gap);
              const cy = 24 + gap + neuronR + row * (neuronR * 2 + gap);
              return (
                <g key={neuron.id}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={neuronR}
                    fill={
                      neuron.active
                        ? `rgba(59, 130, 246, ${0.3 + neuron.value * 0.7})`
                        : "rgba(100, 116, 139, 0.15)"
                    }
                    stroke={neuron.active ? "#3b82f6" : "#475569"}
                    strokeWidth={neuron.active ? 1.5 : 1}
                    strokeDasharray={neuron.active ? undefined : "3,2"}
                  />
                  {neuron.active ? (
                    <text
                      x={cx}
                      y={cy + 3}
                      textAnchor="middle"
                      fontSize={8}
                      fill="#e2e8f0"
                    >
                      {neuron.scaledValue.toFixed(2)}
                    </text>
                  ) : (
                    <>
                      {/* X mark for dropped neurons */}
                      <line
                        x1={cx - 5}
                        y1={cy - 5}
                        x2={cx + 5}
                        y2={cy + 5}
                        stroke="#ef4444"
                        strokeWidth={1.5}
                        opacity={0.6}
                      />
                      <line
                        x1={cx + 5}
                        y1={cy - 5}
                        x2={cx - 5}
                        y2={cy + 5}
                        stroke="#ef4444"
                        strokeWidth={1.5}
                        opacity={0.6}
                      />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
          {dropoutEnabled && (
            <p className="mt-1 text-[10px] text-foreground-subtle">
              Dropped neurons output 0. Active neurons are scaled by 1/(1&minus;{(dropRate * 100).toFixed(0)}%) = {(1 / (1 - dropRate)).toFixed(2)}x (inverted dropout) so expected values stay the same at inference.
            </p>
          )}
        </div>
      )}
    </div>
  );
});

// NN Canvas composite
interface NNCanvasProps {
  dataset: Dataset;
  layerSizes: number[];
  network: NeuralNetwork | null;
  trainedNetwork: NeuralNetwork | null;
  showCNNDemo: boolean;
  showDropoutDemo: boolean;
  onToggleCNN: () => void;
  onToggleDropout: () => void;
}

const NNCanvas = memo(function NNCanvas({
  dataset,
  layerSizes,
  network,
  trainedNetwork,
  showCNNDemo,
  showDropoutDemo,
  onToggleCNN,
  onToggleDropout,
}: NNCanvasProps) {
  const displayNet = trainedNetwork ?? network;

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-background">
      {/* Top row: Dataset / Architecture / Decision Boundary */}
      <div className="flex items-stretch">
        <div className="flex flex-1 flex-col items-center justify-center border-r border-border p-2">
          <span className="mb-1 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Dataset
          </span>
          <ScatterPlot dataset={dataset} width={220} height={220} />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center border-r border-border p-2">
          <span className="mb-1 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Architecture
          </span>
          <NetworkDiagram
            layerSizes={layerSizes}
            network={displayNet}
            width={260}
            height={220}
          />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-2">
          <span className="mb-1 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Decision Boundary
          </span>
          {displayNet ? (
            <DecisionBoundary
              network={displayNet}
              dataset={dataset}
              width={220}
              height={220}
            />
          ) : (
            <div className="flex h-[220px] w-[220px] items-center justify-center rounded border border-dashed border-border">
              <p className="text-xs text-foreground-subtle">Train to see boundary</p>
            </div>
          )}
        </div>
      </div>

      {/* Demo toggle buttons */}
      <div className="flex gap-2 border-t border-border px-3 py-2">
        <button
          onClick={onToggleCNN}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            showCNNDemo
              ? "bg-blue-600 text-white"
              : "bg-elevated text-foreground-muted hover:bg-accent hover:text-foreground"
          )}
        >
          <Layers className="h-3.5 w-3.5" />
          CNN Demo
        </button>
        <button
          onClick={onToggleDropout}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            showDropoutDemo
              ? "bg-amber-600 text-white"
              : "bg-elevated text-foreground-muted hover:bg-accent hover:text-foreground"
          )}
        >
          <EyeOff className="h-3.5 w-3.5" />
          Dropout Demo
        </button>
      </div>

      {/* CNN Demo Panel */}
      {showCNNDemo && (
        <div className="border-t border-border px-3 py-2">
          <CNNDemoPanel />
        </div>
      )}

      {/* Dropout Demo Panel */}
      {showDropoutDemo && (
        <div className="border-t border-border px-3 py-2">
          <DropoutDemoPanel />
        </div>
      )}
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// PIPELINE BUILDER CANVAS
// ══════════════════════════════════════════════════════════════

interface PipelineCanvasProps {
  pipeline: MLPipeline;
  selectedStageId: string | null;
  onStageSelect: (stage: PipelineStage) => void;
}

const PipelineCanvas = memo(function PipelineCanvas({
  pipeline,
  selectedStageId,
  onStageSelect,
}: PipelineCanvasProps) {
  const stages = pipeline.stages;
  const stageCount = stages.length;

  // Layout constants
  const boxW = 160;
  const boxH = 72;
  const gapX = 60;
  const padX = 40;
  const padY = 40;
  const svgW = padX * 2 + stageCount * boxW + (stageCount - 1) * gapX;
  const svgH = padY * 2 + boxH;

  // Build a map of stage id -> index for positioning
  const idxMap = useMemo(() => {
    const m = new Map<string, number>();
    stages.forEach((s, i) => m.set(s.id, i));
    return m;
  }, [stages]);

  const stageX = (idx: number) => padX + idx * (boxW + gapX);
  const stageY = padY;

  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto bg-background p-4">
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="block"
      >
        {/* Connections (arrows) */}
        <defs>
          <marker
            id="pipeline-arrow"
            viewBox="0 0 10 8"
            refX="10"
            refY="4"
            markerWidth="8"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,4 L0,8 Z" fill="#64748b" />
          </marker>
        </defs>
        {pipeline.connections.map((conn) => {
          const fromIdx = idxMap.get(conn.from);
          const toIdx = idxMap.get(conn.to);
          if (fromIdx === undefined || toIdx === undefined) return null;
          const x1 = stageX(fromIdx) + boxW;
          const y1 = stageY + boxH / 2;
          const x2 = stageX(toIdx);
          const y2 = stageY + boxH / 2;
          return (
            <line
              key={`${conn.from}-${conn.to}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#64748b"
              strokeWidth={2}
              markerEnd="url(#pipeline-arrow)"
            />
          );
        })}

        {/* Stage boxes */}
        {stages.map((stage, idx) => {
          const x = stageX(idx);
          const y = stageY;
          const isSelected = selectedStageId === stage.id;
          const color = STAGE_TYPE_COLORS[stage.type];
          return (
            <g
              key={stage.id}
              onClick={() => onStageSelect(stage)}
              className="cursor-pointer"
            >
              {/* Box */}
              <rect
                x={x}
                y={y}
                width={boxW}
                height={boxH}
                rx={8}
                fill={isSelected ? `${color}22` : "#1e293b"}
                stroke={isSelected ? color : "#334155"}
                strokeWidth={isSelected ? 2 : 1}
              />
              {/* Type badge */}
              <rect
                x={x + 8}
                y={y + 8}
                width={8}
                height={8}
                rx={4}
                fill={color}
              />
              <text
                x={x + 22}
                y={y + 16}
                className="text-[8px] font-medium uppercase"
                fill="#94a3b8"
              >
                {STAGE_TYPE_LABELS[stage.type]}
              </text>
              {/* Name */}
              <text
                x={x + boxW / 2}
                y={y + 38}
                textAnchor="middle"
                className="text-[11px] font-semibold"
                fill={isSelected ? "#f8fafc" : "#cbd5e1"}
              >
                {stage.name.length > 22
                  ? stage.name.slice(0, 20) + "..."
                  : stage.name}
              </text>
              {/* Stage index */}
              <text
                x={x + boxW / 2}
                y={y + 56}
                textAnchor="middle"
                className="text-[9px]"
                fill="#64748b"
              >
                Stage {idx + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// MODEL SERVING CANVAS
// ══════════════════════════════════════════════════════════════

interface ServingCanvasProps {
  pattern: ServingPattern;
  animTick: number;
}

const ServingCanvas = memo(function ServingCanvas({
  pattern,
  animTick,
}: ServingCanvasProps) {
  const svgW = 700;
  const svgH = 300;

  // Positions
  const lbX = 200; // load balancer
  const lbY = svgH / 2;
  const modelKeys = Object.keys(pattern.trafficSplit);

  // Current step for metrics display
  const stepIdx = Math.min(animTick, pattern.steps.length - 1);
  const currentStep = pattern.steps[stepIdx] ?? pattern.steps[0];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center overflow-auto bg-background p-4">
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="block">
        {/* Users */}
        <rect x={30} y={lbY - 25} width={80} height={50} rx={8} fill="#1e293b" stroke="#3b82f6" strokeWidth={1.5} />
        <text x={70} y={lbY + 4} textAnchor="middle" className="text-[11px] font-semibold" fill="#93c5fd">
          Users
        </text>

        {/* Arrow: Users -> LB */}
        <line x1={110} y1={lbY} x2={lbX - 30} y2={lbY} stroke="#64748b" strokeWidth={2} strokeDasharray="6,3" />

        {/* Load Balancer / Router */}
        <rect x={lbX - 30} y={lbY - 30} width={60} height={60} rx={8} fill="#1e293b" stroke="#8b5cf6" strokeWidth={1.5} />
        <text x={lbX} y={lbY - 4} textAnchor="middle" className="text-[9px] font-medium" fill="#c4b5fd">
          Traffic
        </text>
        <text x={lbX} y={lbY + 10} textAnchor="middle" className="text-[9px] font-medium" fill="#c4b5fd">
          Router
        </text>

        {/* Model boxes + arrows */}
        {modelKeys.map((name, i) => {
          const modelX = 450;
          const spacing = Math.min(80, (svgH - 80) / Math.max(modelKeys.length - 1, 1));
          const baseY = svgH / 2 - ((modelKeys.length - 1) * spacing) / 2;
          const modelY = baseY + i * spacing;
          const pct = pattern.trafficSplit[name];
          const isSecondary = name.includes("B") || name.includes("New") || name.includes("Shadow");
          const color = isSecondary ? "#f97316" : "#3b82f6";

          // Animated dots along the arrow
          const dots: React.ReactNode[] = [];
          const dotCount = Math.max(1, Math.round((pct / 100) * 5));
          for (let d = 0; d < dotCount; d++) {
            const phase = ((animTick * 0.12 + d * 0.2) % 1);
            const dx = lbX + 30 + phase * (modelX - 50 - lbX - 30);
            const dy = lbY + phase * (modelY - lbY);
            dots.push(
              <circle key={`dot-${i}-${d}`} cx={dx} cy={dy} r={3} fill={color} opacity={0.7 + 0.3 * Math.sin(phase * Math.PI)} />
            );
          }

          return (
            <g key={name}>
              {/* Arrow line */}
              <line
                x1={lbX + 30}
                y1={lbY}
                x2={modelX - 50}
                y2={modelY}
                stroke="#475569"
                strokeWidth={1.5}
              />
              {/* Animated dots */}
              {dots}
              {/* Percentage label on arrow */}
              <text
                x={(lbX + 30 + modelX - 50) / 2}
                y={(lbY + modelY) / 2 - 8}
                textAnchor="middle"
                className="text-[10px] font-semibold"
                fill={color}
              >
                {pct}%
              </text>
              {/* Model box */}
              <rect
                x={modelX - 50}
                y={modelY - 20}
                width={180}
                height={40}
                rx={8}
                fill="#1e293b"
                stroke={color}
                strokeWidth={1.5}
              />
              <text
                x={modelX + 40}
                y={modelY + 4}
                textAnchor="middle"
                className="text-[10px] font-semibold"
                fill={color === "#f97316" ? "#fdba74" : "#93c5fd"}
              >
                {name.length > 26 ? name.slice(0, 24) + "..." : name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Current step description */}
      {currentStep && (
        <div className="mt-3 max-w-lg rounded border border-border bg-elevated px-4 py-2 text-center">
          <p className="text-xs text-foreground-muted">
            <span className="mr-2 font-mono text-foreground">
              Step {currentStep.tick}:
            </span>
            {currentStep.description}
          </p>
        </div>
      )}
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// NN PROPERTIES PANEL
// ══════════════════════════════════════════════════════════════

interface NNPropertiesProps {
  currentEpoch: number;
  totalEpochs: number;
  loss: number;
  accuracy: number;
  layerSizes: number[];
  paramCount: number;
  lossHistory: number[];
}

const NNProperties = memo(function NNProperties({
  currentEpoch,
  totalEpochs,
  loss,
  accuracy,
  layerSizes,
  paramCount,
  lossHistory,
}: NNPropertiesProps) {
  const sparklineWidth = 120;
  const sparklineHeight = 30;
  const sparklinePath = useMemo(() => {
    if (lossHistory.length < 2) return "";
    const maxLoss = Math.max(...lossHistory, 0.001);
    const points = lossHistory.map((l, i) => {
      const x = (i / (lossHistory.length - 1)) * sparklineWidth;
      const y = sparklineHeight - (l / maxLoss) * (sparklineHeight - 2);
      return `${x},${y}`;
    });
    return `M${points.join("L")}`;
  }, [lossHistory]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Training Info
        </h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Epoch</span>
          <p className="text-sm font-semibold text-foreground">{currentEpoch} / {totalEpochs}</p>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Loss (MSE)</span>
          <p className="text-sm font-semibold text-foreground">{loss.toFixed(6)}</p>
          {lossHistory.length > 1 && (
            <svg width={sparklineWidth} height={sparklineHeight} className="mt-1">
              <path d={sparklinePath} fill="none" stroke="#3b82f6" strokeWidth={1.5} />
            </svg>
          )}
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Accuracy</span>
          <p className="text-sm font-semibold text-foreground">{(accuracy * 100).toFixed(1)}%</p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
            <div className="h-full rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${accuracy * 100}%` }} />
          </div>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Network Summary</span>
          <div className="mt-1 rounded border border-border bg-elevated px-2 py-1.5 text-xs text-foreground-muted">
            <p>Layers: {layerSizes.map(String).join(" -> ")}</p>
            <p>Parameters: {paramCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// PIPELINE PROPERTIES PANEL
// ══════════════════════════════════════════════════════════════

interface PipelinePropertiesProps {
  stage: PipelineStage | null;
}

const PipelineProperties = memo(function PipelineProperties({
  stage,
}: PipelinePropertiesProps) {
  if (!stage) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Stage Details
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center px-3">
          <p className="text-xs text-foreground-subtle">
            Click a stage to view its configuration
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Stage Details
        </h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {/* Name + Type */}
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Name</span>
          <p className="text-sm font-semibold text-foreground">{stage.name}</p>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Type</span>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: STAGE_TYPE_COLORS[stage.type] }}
            />
            <span className="text-xs text-foreground">{STAGE_TYPE_LABELS[stage.type]}</span>
          </div>
        </div>
        {/* Description */}
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Description</span>
          <p className="mt-0.5 text-xs leading-relaxed text-foreground-muted">{stage.description}</p>
        </div>
        {/* Schemas */}
        {stage.inputSchema && (
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Input Schema</span>
            <pre className="mt-0.5 overflow-x-auto rounded border border-border bg-elevated px-2 py-1 text-[10px] text-foreground-muted">
              {stage.inputSchema}
            </pre>
          </div>
        )}
        {stage.outputSchema && (
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Output Schema</span>
            <pre className="mt-0.5 overflow-x-auto rounded border border-border bg-elevated px-2 py-1 text-[10px] text-foreground-muted">
              {stage.outputSchema}
            </pre>
          </div>
        )}
        {/* Config */}
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Configuration</span>
          <div className="mt-1 space-y-1">
            {Object.entries(stage.config).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded bg-elevated px-2 py-1">
                <span className="text-[10px] font-mono text-foreground-muted">{key}</span>
                <span className="text-[10px] font-mono text-foreground">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// SERVING PROPERTIES PANEL
// ══════════════════════════════════════════════════════════════

interface ServingPropertiesProps {
  pattern: ServingPattern;
  animTick: number;
}

const ServingProperties = memo(function ServingProperties({
  pattern,
  animTick,
}: ServingPropertiesProps) {
  const stepIdx = Math.min(animTick, pattern.steps.length - 1);
  const currentStep = pattern.steps[stepIdx] ?? pattern.steps[0];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Serving Metrics
        </h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Pattern</span>
          <p className="text-sm font-semibold text-foreground">{pattern.name}</p>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Step {currentStep?.tick ?? 0} / {pattern.steps.length}
          </span>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((stepIdx + 1) / pattern.steps.length) * 100}%` }}
            />
          </div>
        </div>
        {/* Metrics for current step */}
        {currentStep?.metrics && (
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Current Metrics
            </span>
            <div className="mt-1 space-y-1">
              {Object.entries(currentStep.metrics).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded bg-elevated px-2 py-1">
                  <span className="text-[10px] font-mono text-foreground-muted">{key}</span>
                  <span className="text-[10px] font-mono text-foreground">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// BOTTOM PANELS
// ══════════════════════════════════════════════════════════════

// NN Training Log
interface NNBottomPanelProps {
  log: TrainingState[];
}

const NNBottomPanel = memo(function NNBottomPanel({ log }: NNBottomPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Training Log
        </span>
        {log.length > 0 && (
          <span className="text-[10px] text-foreground-subtle">
            ({log.length} epochs)
          </span>
        )}
      </div>
      {log.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-xs text-foreground-subtle">
          Train the network to see epoch-by-epoch results.
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-border text-foreground-muted">
                <th className="px-3 py-1.5 text-left font-medium">Epoch</th>
                <th className="px-3 py-1.5 text-left font-medium">Loss</th>
                <th className="px-3 py-1.5 text-left font-medium">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {log.map((entry) => (
                <tr key={entry.epoch} className="border-b border-border/50 text-foreground-muted">
                  <td className="px-3 py-1 font-mono">{entry.epoch}</td>
                  <td className="px-3 py-1 font-mono">{entry.loss.toFixed(6)}</td>
                  <td className="px-3 py-1 font-mono">{(entry.accuracy * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

// Serving steps timeline
interface ServingBottomPanelProps {
  pattern: ServingPattern;
}

const ServingBottomPanel = memo(function ServingBottomPanel({
  pattern,
}: ServingBottomPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Rollout Timeline
        </span>
        <span className="text-[10px] text-foreground-subtle">
          ({pattern.steps.length} steps)
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-background">
            <tr className="border-b border-border text-foreground-muted">
              <th className="px-3 py-1.5 text-left font-medium">Step</th>
              <th className="px-3 py-1.5 text-left font-medium">Description</th>
              <th className="px-3 py-1.5 text-left font-medium">Key Metrics</th>
            </tr>
          </thead>
          <tbody>
            {pattern.steps.map((step) => (
              <tr key={step.tick} className="border-b border-border/50 text-foreground-muted">
                <td className="px-3 py-1 font-mono">{step.tick}</td>
                <td className="px-3 py-1">{step.description}</td>
                <td className="px-3 py-1 font-mono">
                  {step.metrics
                    ? Object.entries(step.metrics)
                        .slice(0, 3)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// Pipeline info bottom panel
interface PipelineBottomPanelProps {
  pipeline: MLPipeline;
}

const PipelineBottomPanel = memo(function PipelineBottomPanel({
  pipeline,
}: PipelineBottomPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Pipeline Overview
        </span>
        <span className="text-[10px] text-foreground-subtle">
          ({pipeline.stages.length} stages, {pipeline.connections.length} connections)
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-background">
            <tr className="border-b border-border text-foreground-muted">
              <th className="px-3 py-1.5 text-left font-medium">#</th>
              <th className="px-3 py-1.5 text-left font-medium">Stage</th>
              <th className="px-3 py-1.5 text-left font-medium">Type</th>
              <th className="px-3 py-1.5 text-left font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {pipeline.stages.map((stage, idx) => (
              <tr key={stage.id} className="border-b border-border/50 text-foreground-muted">
                <td className="px-3 py-1 font-mono">{idx + 1}</td>
                <td className="px-3 py-1 font-semibold">{stage.name}</td>
                <td className="px-3 py-1">
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: STAGE_TYPE_COLORS[stage.type] }}
                    />
                    {STAGE_TYPE_LABELS[stage.type]}
                  </span>
                </td>
                <td className="max-w-xs truncate px-3 py-1">{stage.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// A/B TESTING CANVAS
// ══════════════════════════════════════════════════════════════

interface ABTestingCanvasProps {
  result: ABTestResult | null;
}

const AB_BAR_COLORS = ["#3b82f6", "#f97316"];

const ABTestingCanvas = memo(function ABTestingCanvas({
  result,
}: ABTestingCanvasProps) {
  if (!result) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <p className="text-sm text-foreground-subtle">
          Configure parameters and click &quot;Run Test&quot; to see results.
        </p>
      </div>
    );
  }

  const svgW = 660;
  const svgH = 300;
  const barW = 80;
  const gap = 120;
  const maxRate = Math.max(result.controlConversion, result.treatmentConversion, 0.01);
  const barMaxH = 180;
  const baseY = 250;
  const cH = (result.controlConversion / (maxRate * 1.3)) * barMaxH;
  const tH = (result.treatmentConversion / (maxRate * 1.3)) * barMaxH;
  const cX = svgW / 2 - gap / 2 - barW;
  const tX = svgW / 2 + gap / 2;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center overflow-auto bg-background p-4">
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="block">
        {/* Baseline */}
        <line x1={40} y1={baseY} x2={svgW - 40} y2={baseY} stroke="#334155" strokeWidth={1} />

        {/* Control bar */}
        <rect
          x={cX}
          y={baseY - cH}
          width={barW}
          height={cH}
          rx={4}
          fill={AB_BAR_COLORS[0]}
          opacity={0.85}
        />
        <text x={cX + barW / 2} y={baseY - cH - 10} textAnchor="middle" className="text-[12px] font-semibold" fill="#93c5fd">
          {(result.controlConversion * 100).toFixed(2)}%
        </text>
        <text x={cX + barW / 2} y={baseY + 18} textAnchor="middle" className="text-[11px] font-medium" fill="#94a3b8">
          Control
        </text>

        {/* Treatment bar */}
        <rect
          x={tX}
          y={baseY - tH}
          width={barW}
          height={tH}
          rx={4}
          fill={AB_BAR_COLORS[1]}
          opacity={0.85}
        />
        <text x={tX + barW / 2} y={baseY - tH - 10} textAnchor="middle" className="text-[12px] font-semibold" fill="#fdba74">
          {(result.treatmentConversion * 100).toFixed(2)}%
        </text>
        <text x={tX + barW / 2} y={baseY + 18} textAnchor="middle" className="text-[11px] font-medium" fill="#94a3b8">
          Treatment
        </text>

        {/* Significance badge */}
        <rect
          x={svgW / 2 - 60}
          y={20}
          width={120}
          height={28}
          rx={14}
          fill={result.isSignificant ? "#16a34a22" : "#f5970622"}
          stroke={result.isSignificant ? "#16a34a" : "#f59706"}
          strokeWidth={1.5}
        />
        <text x={svgW / 2} y={39} textAnchor="middle" className="text-[11px] font-semibold" fill={result.isSignificant ? "#4ade80" : "#fbbf24"}>
          {result.isSignificant ? "Significant" : "Not Significant"}
        </text>

        {/* Lift arrow between bars */}
        {Math.abs(result.lift) > 0 && (
          <>
            <line
              x1={cX + barW + 10}
              y1={baseY - cH}
              x2={tX - 10}
              y2={baseY - tH}
              stroke="#64748b"
              strokeWidth={1}
              strokeDasharray="4,3"
            />
            <text
              x={svgW / 2}
              y={Math.min(baseY - cH, baseY - tH) - 4}
              textAnchor="middle"
              className="text-[10px] font-semibold"
              fill={result.lift > 0 ? "#4ade80" : "#f87171"}
            >
              {result.lift > 0 ? "+" : ""}{(result.lift * 100).toFixed(1)}% lift
            </text>
          </>
        )}
      </svg>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// A/B TESTING PROPERTIES PANEL
// ══════════════════════════════════════════════════════════════

interface ABTestingPropertiesProps {
  result: ABTestResult | null;
}

const ABTestingProperties = memo(function ABTestingProperties({
  result,
}: ABTestingPropertiesProps) {
  if (!result) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Test Results
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center px-3">
          <p className="text-xs text-foreground-subtle">Run a test to see results</p>
        </div>
      </div>
    );
  }

  const metrics: [string, string][] = [
    ["p-Value", result.pValue.toFixed(6)],
    ["Significant", result.isSignificant ? "Yes" : "No"],
    ["Lift", `${(result.lift * 100).toFixed(2)}%`],
    ["Control Rate", `${(result.controlConversion * 100).toFixed(2)}%`],
    ["Treatment Rate", `${(result.treatmentConversion * 100).toFixed(2)}%`],
    ["Sample Size", result.sampleSize.toLocaleString()],
    ["Required n", result.requiredSampleSize.toLocaleString()],
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Test Results
        </h2>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {metrics.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded bg-elevated px-2 py-1">
            <span className="text-[10px] font-mono text-foreground-muted">{label}</span>
            <span className="text-[10px] font-mono text-foreground">{value}</span>
          </div>
        ))}
        {/* Confidence interval bar */}
        <div className="pt-2">
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Confidence Interval
          </label>
          <div className="h-2 w-full overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (1 - result.pValue) * 100)}%`,
                backgroundColor: result.isSignificant ? "#16a34a" : "#f59e0b",
              }}
            />
          </div>
          <p className="mt-0.5 text-[10px] text-foreground-subtle">
            {((1 - result.pValue) * 100).toFixed(1)}% confidence
          </p>
        </div>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// A/B TESTING BOTTOM PANEL
// ══════════════════════════════════════════════════════════════

interface ABTestingBottomPanelProps {
  result: ABTestResult | null;
}

const ABTestingBottomPanel = memo(function ABTestingBottomPanel({
  result,
}: ABTestingBottomPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          A/B Test Analysis
        </span>
      </div>
      {!result ? (
        <div className="flex flex-1 items-center justify-center text-xs text-foreground-subtle">
          Run a test to see the analysis.
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-border text-foreground-muted">
                <th className="px-3 py-1.5 text-left font-medium">Metric</th>
                <th className="px-3 py-1.5 text-left font-medium">Control</th>
                <th className="px-3 py-1.5 text-left font-medium">Treatment</th>
                <th className="px-3 py-1.5 text-left font-medium">Delta</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50 text-foreground-muted">
                <td className="px-3 py-1 font-medium">Conversion Rate</td>
                <td className="px-3 py-1 font-mono">{(result.controlConversion * 100).toFixed(2)}%</td>
                <td className="px-3 py-1 font-mono">{(result.treatmentConversion * 100).toFixed(2)}%</td>
                <td className="px-3 py-1 font-mono" style={{ color: result.lift > 0 ? "#4ade80" : "#f87171" }}>
                  {result.lift > 0 ? "+" : ""}{(result.lift * 100).toFixed(2)}%
                </td>
              </tr>
              <tr className="border-b border-border/50 text-foreground-muted">
                <td className="px-3 py-1 font-medium">p-Value</td>
                <td className="px-3 py-1 font-mono" colSpan={2}>{result.pValue.toFixed(6)}</td>
                <td className="px-3 py-1 font-mono" style={{ color: result.isSignificant ? "#4ade80" : "#fbbf24" }}>
                  {result.isSignificant ? "Reject H0" : "Fail to Reject H0"}
                </td>
              </tr>
              <tr className="border-b border-border/50 text-foreground-muted">
                <td className="px-3 py-1 font-medium">Sample Size</td>
                <td className="px-3 py-1 font-mono" colSpan={2}>{result.sampleSize.toLocaleString()} per variant</td>
                <td className="px-3 py-1 font-mono">
                  Need {result.requiredSampleSize.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// EXPERIMENTATION (BANDIT) CANVAS
// ══════════════════════════════════════════════════════════════

const BANDIT_ARM_COLORS = [
  "#3b82f6", "#f97316", "#10b981", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f59e0b", "#6366f1",
];

interface BanditCanvasProps {
  steps: BanditStep[];
  animTick: number;
}

const BanditCanvas = memo(function BanditCanvas({
  steps,
  animTick,
}: BanditCanvasProps) {
  if (steps.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <p className="text-sm text-foreground-subtle">
          Configure strategy and click &quot;Run Simulation&quot; to visualise.
        </p>
      </div>
    );
  }

  const stepIdx = Math.min(animTick, steps.length - 1);
  const currentStep = steps[stepIdx];
  const armCount = currentStep.arms.length;

  const svgW = 660;
  const svgH = 300;
  const padL = 60;
  const padR = 30;
  const padT = 40;
  const padB = 50;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const barW = Math.min(60, (chartW - (armCount - 1) * 12) / armCount);
  const gap = (chartW - armCount * barW) / Math.max(armCount - 1, 1);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center overflow-auto bg-background p-4">
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="block">
        {/* Y axis */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#334155" strokeWidth={1} />
        {/* X axis */}
        <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#334155" strokeWidth={1} />

        {/* Y axis labels */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((v) => {
          const y = padT + chartH - v * chartH;
          return (
            <g key={v}>
              <line x1={padL - 4} y1={y} x2={padL} y2={y} stroke="#475569" strokeWidth={1} />
              <text x={padL - 8} y={y + 3} textAnchor="end" className="text-[9px]" fill="#64748b">
                {v.toFixed(2)}
              </text>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#1e293b" strokeWidth={0.5} />
            </g>
          );
        })}

        {/* Title */}
        <text x={svgW / 2} y={20} textAnchor="middle" className="text-[11px] font-semibold" fill="#94a3b8">
          Estimated Arm Values — Round {stepIdx + 1} / {steps.length}
        </text>

        {/* Bars */}
        {currentStep.arms.map((arm, i) => {
          const x = padL + i * (barW + gap);
          const val = Math.max(0, Math.min(1, arm.estimatedValue));
          const h = val * chartH;
          const color = BANDIT_ARM_COLORS[i % BANDIT_ARM_COLORS.length];
          const isSelected = currentStep.selectedArm === arm.id;

          return (
            <g key={arm.id}>
              <rect
                x={x}
                y={padT + chartH - h}
                width={barW}
                height={Math.max(h, 1)}
                rx={3}
                fill={color}
                opacity={isSelected ? 1 : 0.6}
                stroke={isSelected ? "#ffffff" : "none"}
                strokeWidth={isSelected ? 2 : 0}
              />
              {/* Value label */}
              <text
                x={x + barW / 2}
                y={padT + chartH - h - 6}
                textAnchor="middle"
                className="text-[10px] font-semibold"
                fill={color}
              >
                {val.toFixed(3)}
              </text>
              {/* Arm label */}
              <text
                x={x + barW / 2}
                y={padT + chartH + 16}
                textAnchor="middle"
                className="text-[10px] font-medium"
                fill="#94a3b8"
              >
                {arm.id}
              </text>
              {/* Pull count */}
              <text
                x={x + barW / 2}
                y={padT + chartH + 30}
                textAnchor="middle"
                className="text-[9px]"
                fill="#64748b"
              >
                {arm.pulls} pulls
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// BANDIT PROPERTIES PANEL
// ══════════════════════════════════════════════════════════════

interface BanditPropertiesProps {
  steps: BanditStep[];
  animTick: number;
}

const BanditProperties = memo(function BanditProperties({
  steps,
  animTick,
}: BanditPropertiesProps) {
  if (steps.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Bandit Info
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center px-3">
          <p className="text-xs text-foreground-subtle">Run a simulation to see metrics</p>
        </div>
      </div>
    );
  }

  const stepIdx = Math.min(animTick, steps.length - 1);
  const currentStep = steps[stepIdx];
  const totalPulls = currentStep.arms.reduce((s, a) => s + a.pulls, 0);
  const totalRewards = currentStep.arms.reduce((s, a) => s + a.rewards, 0);
  const bestArm = [...currentStep.arms].sort((a, b) => b.estimatedValue - a.estimatedValue)[0];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Bandit Metrics
        </h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Round</span>
          <p className="text-sm font-semibold text-foreground">{stepIdx + 1} / {steps.length}</p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Strategy</span>
          <p className="text-sm font-semibold text-foreground">{currentStep.strategy}</p>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Last Selected</span>
          <p className="text-sm font-semibold text-foreground">{currentStep.selectedArm}</p>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Overall Reward Rate</span>
          <p className="text-sm font-semibold text-foreground">
            {totalPulls > 0 ? ((totalRewards / totalPulls) * 100).toFixed(1) : "0.0"}%
          </p>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Best Arm</span>
          <p className="text-sm font-semibold text-foreground">
            {bestArm.id} ({(bestArm.estimatedValue * 100).toFixed(1)}%)
          </p>
        </div>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// BANDIT BOTTOM PANEL
// ══════════════════════════════════════════════════════════════

interface BanditBottomPanelProps {
  steps: BanditStep[];
  animTick: number;
}

const BanditBottomPanel = memo(function BanditBottomPanel({
  steps,
  animTick,
}: BanditBottomPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stepIdx = Math.min(animTick, steps.length - 1);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [animTick]);

  // Show last 50 steps up to current tick
  const visibleSteps = steps.slice(Math.max(0, stepIdx - 49), stepIdx + 1);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Selection Log
        </span>
        {steps.length > 0 && (
          <span className="text-[10px] text-foreground-subtle">
            (showing last {visibleSteps.length} of {steps.length})
          </span>
        )}
      </div>
      {steps.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-xs text-foreground-subtle">
          Run a simulation to see the selection log.
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-border text-foreground-muted">
                <th className="px-3 py-1.5 text-left font-medium">Round</th>
                <th className="px-3 py-1.5 text-left font-medium">Selected</th>
                <th className="px-3 py-1.5 text-left font-medium">Reward</th>
                <th className="px-3 py-1.5 text-left font-medium">Best Est.</th>
              </tr>
            </thead>
            <tbody>
              {visibleSteps.map((step) => {
                const best = [...step.arms].sort((a, b) => b.estimatedValue - a.estimatedValue)[0];
                return (
                  <tr key={step.tick} className="border-b border-border/50 text-foreground-muted">
                    <td className="px-3 py-1 font-mono">{step.tick}</td>
                    <td className="px-3 py-1 font-mono">{step.selectedArm}</td>
                    <td className="px-3 py-1 font-mono">{step.reward}</td>
                    <td className="px-3 py-1 font-mono">{best.id} ({best.estimatedValue.toFixed(3)})</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// FEATURE STORE CANVAS
// ══════════════════════════════════════════════════════════════

interface FeatureStoreCanvasProps {
  steps: FeatureStoreStep[];
  animTick: number;
}

// Node layout constants
const FS_SVG_W = 820;
const FS_SVG_H = 420;

const FS_NODES = {
  rawData: { x: 40, y: 160, w: 100, h: 50, label: "Raw Data", sub: "Kafka + S3", color: "#64748b" },
  streamPipe: { x: 210, y: 80, w: 120, h: 50, label: "Stream Pipeline", sub: "Flink", color: "#3b82f6" },
  batchPipe: { x: 210, y: 240, w: 120, h: 50, label: "Batch Pipeline", sub: "Spark", color: "#8b5cf6" },
  featureCalc: { x: 410, y: 160, w: 120, h: 50, label: "Feature Registry", sub: "Computed", color: "#10b981" },
  onlineStore: { x: 610, y: 80, w: 120, h: 50, label: "Online Store", sub: "Redis (<5ms)", color: "#f97316" },
  offlineStore: { x: 610, y: 240, w: 120, h: 50, label: "Offline Store", sub: "S3 / Parquet", color: "#8b5cf6" },
  serving: { x: 610, y: 10, w: 120, h: 40, label: "Model Serving", sub: "Real-time", color: "#f43f5e" },
  training: { x: 610, y: 330, w: 120, h: 40, label: "Model Training", sub: "Point-in-time", color: "#06b6d4" },
} as const;

type FSNodeKey = keyof typeof FS_NODES;

const FS_ARROWS: Array<{ from: FSNodeKey; to: FSNodeKey; label?: string }> = [
  { from: "rawData", to: "streamPipe", label: "events" },
  { from: "rawData", to: "batchPipe", label: "files" },
  { from: "streamPipe", to: "featureCalc" },
  { from: "batchPipe", to: "featureCalc" },
  { from: "featureCalc", to: "onlineStore", label: "low-latency" },
  { from: "featureCalc", to: "offlineStore", label: "historical" },
  { from: "onlineStore", to: "serving", label: "fetch" },
  { from: "offlineStore", to: "training", label: "join" },
];

// Map each tick's action to the nodes/edges that should be highlighted
const TICK_HIGHLIGHTS: Record<string, { nodes: FSNodeKey[]; edges: Array<[FSNodeKey, FSNodeKey]> }> = {
  "data-ingestion": { nodes: ["rawData", "streamPipe", "batchPipe"], edges: [["rawData", "streamPipe"], ["rawData", "batchPipe"]] },
  "stream-computation": { nodes: ["streamPipe", "featureCalc"], edges: [["streamPipe", "featureCalc"]] },
  "batch-computation": { nodes: ["batchPipe", "featureCalc"], edges: [["batchPipe", "featureCalc"]] },
  "online-store-write": { nodes: ["featureCalc", "onlineStore"], edges: [["featureCalc", "onlineStore"]] },
  "offline-store-write": { nodes: ["featureCalc", "offlineStore"], edges: [["featureCalc", "offlineStore"]] },
  "training-read": { nodes: ["offlineStore", "training"], edges: [["offlineStore", "training"]] },
  "serving-read": { nodes: ["onlineStore", "serving"], edges: [["onlineStore", "serving"]] },
  "incremental-update": { nodes: ["rawData", "streamPipe", "featureCalc", "onlineStore", "offlineStore"], edges: [["rawData", "streamPipe"], ["streamPipe", "featureCalc"], ["featureCalc", "onlineStore"], ["featureCalc", "offlineStore"]] },
};

const FeatureStoreCanvas = memo(function FeatureStoreCanvas({
  steps,
  animTick,
}: FeatureStoreCanvasProps) {
  if (steps.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <p className="text-sm text-foreground-subtle">
          Click &quot;Run&quot; to simulate the Feature Store lifecycle.
        </p>
      </div>
    );
  }

  const stepIdx = Math.min(animTick, steps.length - 1);
  const currentStep = steps[stepIdx];
  const highlights = TICK_HIGHLIGHTS[currentStep.action] ?? { nodes: [], edges: [] };

  const isNodeActive = (key: FSNodeKey) => highlights.nodes.includes(key);
  const isEdgeActive = (from: FSNodeKey, to: FSNodeKey) =>
    highlights.edges.some(([f, t]) => f === from && t === to);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center overflow-auto bg-background p-4">
      <svg
        width={FS_SVG_W}
        height={FS_SVG_H}
        viewBox={`0 0 ${FS_SVG_W} ${FS_SVG_H}`}
        className="block"
      >
        <defs>
          <marker
            id="fs-arrow"
            viewBox="0 0 10 8"
            refX="10"
            refY="4"
            markerWidth="8"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,4 L0,8 Z" fill="#64748b" />
          </marker>
          <marker
            id="fs-arrow-active"
            viewBox="0 0 10 8"
            refX="10"
            refY="4"
            markerWidth="8"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,4 L0,8 Z" fill="#fbbf24" />
          </marker>
        </defs>

        {/* Arrows */}
        {FS_ARROWS.map(({ from, to, label }) => {
          const fNode = FS_NODES[from];
          const tNode = FS_NODES[to];
          const x1 = fNode.x + fNode.w;
          const y1 = fNode.y + fNode.h / 2;
          const x2 = tNode.x;
          const y2 = tNode.y + tNode.h / 2;
          const active = isEdgeActive(from, to);

          // Animated dot along the edge
          const dotPhase = active ? ((animTick * 0.25) % 1) : -1;
          const dx = x1 + dotPhase * (x2 - x1);
          const dy = y1 + dotPhase * (y2 - y1);

          return (
            <g key={`${from}-${to}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={active ? "#fbbf24" : "#475569"}
                strokeWidth={active ? 2.5 : 1.5}
                markerEnd={active ? "url(#fs-arrow-active)" : "url(#fs-arrow)"}
                opacity={active ? 1 : 0.5}
              />
              {label && (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 8}
                  textAnchor="middle"
                  className="text-[8px]"
                  fill={active ? "#fbbf24" : "#64748b"}
                >
                  {label}
                </text>
              )}
              {active && dotPhase >= 0 && (
                <circle
                  cx={dx}
                  cy={dy}
                  r={4}
                  fill="#fbbf24"
                  opacity={0.8 + 0.2 * Math.sin(dotPhase * Math.PI)}
                >
                  <animate
                    attributeName="opacity"
                    values="0.6;1;0.6"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {(Object.entries(FS_NODES) as Array<[FSNodeKey, typeof FS_NODES[FSNodeKey]]>).map(
          ([key, node]) => {
            const active = isNodeActive(key);
            return (
              <g key={key}>
                {/* Glow for active nodes */}
                {active && (
                  <rect
                    x={node.x - 3}
                    y={node.y - 3}
                    width={node.w + 6}
                    height={node.h + 6}
                    rx={11}
                    fill="none"
                    stroke={node.color}
                    strokeWidth={2}
                    opacity={0.5}
                  >
                    <animate
                      attributeName="opacity"
                      values="0.3;0.7;0.3"
                      dur="1.2s"
                      repeatCount="indefinite"
                    />
                  </rect>
                )}
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={node.h}
                  rx={8}
                  fill={active ? `${node.color}33` : "#1e293b"}
                  stroke={active ? node.color : "#334155"}
                  strokeWidth={active ? 2 : 1}
                />
                <text
                  x={node.x + node.w / 2}
                  y={node.y + node.h / 2 - 4}
                  textAnchor="middle"
                  className="text-[10px] font-semibold"
                  fill={active ? "#f8fafc" : "#cbd5e1"}
                >
                  {node.label}
                </text>
                <text
                  x={node.x + node.w / 2}
                  y={node.y + node.h / 2 + 10}
                  textAnchor="middle"
                  className="text-[8px]"
                  fill={active ? node.color : "#64748b"}
                >
                  {node.sub}
                </text>
              </g>
            );
          }
        )}
      </svg>

      {/* Current step description */}
      <div className="mt-3 max-w-lg rounded border border-border bg-elevated px-4 py-2 text-center">
        <p className="text-xs text-foreground-muted">
          <span className="mr-2 font-mono text-foreground">
            Step {currentStep.tick}:
          </span>
          {currentStep.description}
        </p>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// FEATURE STORE PROPERTIES PANEL
// ══════════════════════════════════════════════════════════════

interface FeatureStorePropertiesProps {
  steps: FeatureStoreStep[];
  animTick: number;
}

const FeatureStoreProperties = memo(function FeatureStoreProperties({
  steps,
  animTick,
}: FeatureStorePropertiesProps) {
  if (steps.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Feature Store Info
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center px-3">
          <p className="text-xs text-foreground-subtle">Run simulation to see details</p>
        </div>
      </div>
    );
  }

  const stepIdx = Math.min(animTick, steps.length - 1);
  const currentStep = steps[stepIdx];
  const { onlineStore, offlineStore } = currentStep.state;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Feature Store Info
        </h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Step</span>
          <p className="text-sm font-semibold text-foreground">
            {currentStep.tick} / {steps.length}
          </p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Action</span>
          <p className="text-sm font-semibold text-foreground">{currentStep.action}</p>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Online Store ({onlineStore.length} keys)
          </span>
          {onlineStore.length > 0 ? (
            <div className="mt-1 space-y-1">
              {onlineStore.slice(0, 3).map((entry) => (
                <div key={entry.key} className="rounded bg-elevated px-2 py-1">
                  <span className="text-[10px] font-mono text-foreground">{entry.key}</span>
                  <span className="ml-2 text-[10px] text-foreground-subtle">TTL: {entry.ttl}s</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-0.5 text-[10px] text-foreground-subtle">Empty</p>
          )}
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Offline Store ({offlineStore.length} records)
          </span>
          {offlineStore.length > 0 ? (
            <div className="mt-1 space-y-1">
              {offlineStore.slice(0, 3).map((entry, i) => (
                <div key={`${entry.key}-${i}`} className="rounded bg-elevated px-2 py-1">
                  <span className="text-[10px] font-mono text-foreground">{entry.key}</span>
                  <span className="ml-2 text-[10px] text-foreground-subtle">
                    {entry.timestamp.slice(0, 16)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-0.5 text-[10px] text-foreground-subtle">Empty</p>
          )}
        </div>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// FEATURE STORE BOTTOM PANEL
// ══════════════════════════════════════════════════════════════

interface FeatureStoreBottomPanelProps {
  steps: FeatureStoreStep[];
  animTick: number;
}

const FeatureStoreBottomPanel = memo(function FeatureStoreBottomPanel({
  steps,
  animTick,
}: FeatureStoreBottomPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stepIdx = Math.min(animTick, steps.length - 1);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [animTick]);

  const visibleSteps = steps.slice(0, stepIdx + 1);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Feature Store Timeline
        </span>
        {steps.length > 0 && (
          <span className="text-[10px] text-foreground-subtle">
            ({visibleSteps.length} of {steps.length} steps)
          </span>
        )}
      </div>
      {steps.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-xs text-foreground-subtle">
          Run the simulation to see the step-by-step timeline.
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-border text-foreground-muted">
                <th className="px-3 py-1.5 text-left font-medium">Step</th>
                <th className="px-3 py-1.5 text-left font-medium">Action</th>
                <th className="px-3 py-1.5 text-left font-medium">Description</th>
                <th className="px-3 py-1.5 text-left font-medium">Online / Offline</th>
              </tr>
            </thead>
            <tbody>
              {visibleSteps.map((step) => (
                <tr
                  key={step.tick}
                  className={cn(
                    "border-b border-border/50 text-foreground-muted",
                    step.tick === stepIdx + 1 && "bg-accent/20"
                  )}
                >
                  <td className="px-3 py-1 font-mono">{step.tick}</td>
                  <td className="px-3 py-1 font-mono">{step.action}</td>
                  <td className="max-w-xs truncate px-3 py-1">{step.description}</td>
                  <td className="px-3 py-1 font-mono">
                    {step.state.onlineStore.length} / {step.state.offlineStore.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
// MAIN HOOK
// ══════════════════════════════════════════════════════════════

export function useMLDesignModule() {
  // ── Mode ────────────────────────────────────────────────
  const [mode, setMode] = useState<ModuleMode>("neural-network");

  // ── Neural Network state ────────────────────────────────
  const [datasetType, setDatasetType] = useState<DatasetType>("circle");
  const [layerCount, setLayerCount] = useState(2);
  const [neuronsPerLayer, setNeuronsPerLayer] = useState(4);
  const [activation, setActivation] = useState<ActivationType>("sigmoid");
  const [learningRate, setLearningRate] = useState(0.1);
  const [epochs, setEpochs] = useState(100);
  const [isTraining, setIsTraining] = useState(false);
  const [showCNNDemo, setShowCNNDemo] = useState(false);
  const [showDropoutDemo, setShowDropoutDemo] = useState(false);
  const [trainingLog, setTrainingLog] = useState<TrainingState[]>([]);
  const [trainedNetwork, setTrainedNetwork] = useState<NeuralNetwork | null>(null);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [currentLoss, setCurrentLoss] = useState(0);
  const [currentAccuracy, setCurrentAccuracy] = useState(0);
  const [lossHistory, setLossHistory] = useState<number[]>([]);
  const cancelRef = useRef(false);

  // ── Pipeline Builder state ──────────────────────────────
  const [pipelineId, setPipelineId] = useState(PIPELINE_TEMPLATES[0].id);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);

  const selectedPipeline = useMemo(
    () => PIPELINE_TEMPLATES.find((t) => t.id === pipelineId) ?? PIPELINE_TEMPLATES[0],
    [pipelineId]
  );

  // ── Model Serving state ─────────────────────────────────
  const [servingMode, setServingMode] = useState<ServingMode>("ab-test");
  const [abSplit, setAbSplit] = useState(20);
  const [servingAnimTick, setServingAnimTick] = useState(0);

  // ── A/B Testing state ──────────────────────────────────
  const [abControlRate, setAbControlRate] = useState(0.1);
  const [abTreatmentRate, setAbTreatmentRate] = useState(0.13);
  const [abSampleSize, setAbSampleSize] = useState(5000);
  const [abTestResult, setAbTestResult] = useState<ABTestResult | null>(null);

  // ── Bandit state ───────────────────────────────────────
  const [banditStrategy, setBanditStrategy] = useState<BanditStrategy>("epsilon-greedy");
  const [banditArmCount, setBanditArmCount] = useState(4);
  const [banditRounds, setBanditRounds] = useState(200);
  const [banditEpsilon, setBanditEpsilon] = useState(0.1);
  const [banditSteps, setBanditSteps] = useState<BanditStep[]>([]);
  const [banditAnimTick, setBanditAnimTick] = useState(0);
  const [banditIsRunning, setBanditIsRunning] = useState(false);

  // ── Feature Store state ────────────────────────────────
  const [fsSteps, setFsSteps] = useState<FeatureStoreStep[]>([]);
  const [fsAnimTick, setFsAnimTick] = useState(0);
  const [fsIsRunning, setFsIsRunning] = useState(false);

  const servingPattern = useMemo<ServingPattern>(() => {
    switch (servingMode) {
      case "ab-test":
        return simulateABTest(abSplit, 10000);
      case "canary":
        return simulateCanary([1, 5, 25, 50, 100]);
      case "shadow":
        return simulateShadow();
    }
  }, [servingMode, abSplit]);

  // Animate serving ticks
  useEffect(() => {
    if (mode !== "model-serving") return;
    setServingAnimTick(0);
    const interval = setInterval(() => {
      setServingAnimTick((t) => (t + 1) % (servingPattern.steps.length * 8));
    }, 400);
    return () => clearInterval(interval);
  }, [mode, servingPattern.steps.length]);

  // Animate bandit ticks
  useEffect(() => {
    if (mode !== "experimentation" || banditSteps.length === 0 || !banditIsRunning) return;
    setBanditAnimTick(0);
    const interval = setInterval(() => {
      setBanditAnimTick((t) => {
        if (t >= banditSteps.length - 1) {
          setBanditIsRunning(false);
          return banditSteps.length - 1;
        }
        return t + 1;
      });
    }, Math.max(20, Math.min(100, 5000 / banditSteps.length)));
    return () => clearInterval(interval);
  }, [mode, banditSteps.length, banditIsRunning]);

  // ── A/B Testing handler ────────────────────────────────
  const handleRunABTest = useCallback(() => {
    const result = runABTest(abControlRate, abTreatmentRate, abSampleSize);
    setAbTestResult(result);
  }, [abControlRate, abTreatmentRate, abSampleSize]);

  // ── Bandit handler ─────────────────────────────────────
  const handleRunBandit = useCallback(() => {
    let steps: BanditStep[];
    switch (banditStrategy) {
      case "epsilon-greedy":
        steps = simulateEpsilonGreedy(banditArmCount, banditRounds, banditEpsilon);
        break;
      case "ucb1":
        steps = simulateUCB1(banditArmCount, banditRounds);
        break;
      case "thompson-sampling":
        steps = simulateThompsonSampling(banditArmCount, banditRounds);
        break;
    }
    setBanditSteps(steps);
    setBanditAnimTick(0);
    setBanditIsRunning(true);
  }, [banditStrategy, banditArmCount, banditRounds, banditEpsilon]);

  // ── Feature Store handlers ────────────────────────────
  const handleRunFeatureStore = useCallback(() => {
    const steps = simulateFeatureStore();
    setFsSteps(steps);
    setFsAnimTick(0);
    setFsIsRunning(true);
  }, []);

  const handleResetFeatureStore = useCallback(() => {
    setFsSteps([]);
    setFsAnimTick(0);
    setFsIsRunning(false);
  }, []);

  // Animate feature store ticks
  useEffect(() => {
    if (mode !== "feature-store" || fsSteps.length === 0 || !fsIsRunning) return;
    setFsAnimTick(0);
    const interval = setInterval(() => {
      setFsAnimTick((t) => {
        if (t >= fsSteps.length - 1) {
          setFsIsRunning(false);
          return fsSteps.length - 1;
        }
        return t + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [mode, fsSteps.length, fsIsRunning]);

  // ── NN derived values ───────────────────────────────────
  const dataset = useMemo<Dataset>(
    () => DATASET_GENERATORS[datasetType](DATASET_SAMPLE_COUNT),
    [datasetType]
  );

  const layerSizes = useMemo(() => {
    const sizes = [2];
    for (let i = 0; i < layerCount; i++) sizes.push(neuronsPerLayer);
    sizes.push(1);
    return sizes;
  }, [layerCount, neuronsPerLayer]);

  const paramCount = useMemo(() => {
    let total = 0;
    for (let i = 0; i < layerSizes.length - 1; i++) {
      total += layerSizes[i] * layerSizes[i + 1] + layerSizes[i + 1];
    }
    return total;
  }, [layerSizes]);

  const activations = useMemo<ActivationType[]>(() => {
    const acts: ActivationType[] = [];
    for (let i = 0; i < layerCount; i++) acts.push(activation);
    acts.push("sigmoid");
    return acts;
  }, [layerCount, activation]);

  // ── NN handlers ─────────────────────────────────────────
  const handleTrain = useCallback(() => {
    setIsTraining(true);
    setTrainingLog([]);
    setLossHistory([]);
    setCurrentEpoch(0);
    setCurrentLoss(0);
    setCurrentAccuracy(0);
    cancelRef.current = false;

    const net = new NeuralNetwork(layerSizes, activations);
    const inputs = dataset.points.map(([x, y]) => [x, y]);
    const targets = dataset.labels.map((l) => [l]);
    const totalEpochs = epochs;
    const batchSize = Math.max(1, Math.min(5, Math.floor(totalEpochs / 50)));
    let epochsDone = 0;
    const logAccumulator: TrainingState[] = [];
    const lossAcc: number[] = [];

    function runBatch() {
      if (cancelRef.current || epochsDone >= totalEpochs) {
        setTrainedNetwork(net);
        setIsTraining(false);
        return;
      }
      const batchEnd = Math.min(epochsDone + batchSize, totalEpochs);
      net.train(inputs, targets, learningRate, batchEnd - epochsDone, (state) => {
        const adjustedState = { ...state, epoch: epochsDone + state.epoch };
        logAccumulator.push(adjustedState);
        lossAcc.push(adjustedState.loss);
      });
      epochsDone = batchEnd;
      const last = logAccumulator[logAccumulator.length - 1];
      if (last) {
        setCurrentEpoch(last.epoch);
        setCurrentLoss(last.loss);
        setCurrentAccuracy(last.accuracy);
      }
      setTrainingLog([...logAccumulator]);
      setLossHistory([...lossAcc]);
      setTrainedNetwork(net);
      requestAnimationFrame(runBatch);
    }

    requestAnimationFrame(runBatch);
  }, [layerSizes, activations, dataset, epochs, learningRate]);

  // Cancel any in-flight RAF training loop when the component unmounts
  useEffect(() => {
    return () => {
      cancelRef.current = true;
    };
  }, []);

  const handleReset = useCallback(() => {
    cancelRef.current = true;
    setIsTraining(false);
    setTrainingLog([]);
    setLossHistory([]);
    setCurrentEpoch(0);
    setCurrentLoss(0);
    setCurrentAccuracy(0);
    setTrainedNetwork(null);
  }, []);

  // ── CNN / Dropout demo toggles ──────────────────────────
  const handleToggleCNN = useCallback(() => {
    setShowCNNDemo((v) => !v);
  }, []);

  const handleToggleDropout = useCallback(() => {
    setShowDropoutDemo((v) => !v);
  }, []);

  // ── Pipeline handlers ───────────────────────────────────
  const handlePipelineChange = useCallback((id: string) => {
    setPipelineId(id);
    setSelectedStage(null);
  }, []);

  const handleStageSelectFromCanvas = useCallback((stage: PipelineStage) => {
    setSelectedStage((prev) => (prev?.id === stage.id ? null : stage));
  }, []);

  // ── Build panels ────────────────────────────────────────
  const sidebar = (
    <MLSidebar
      mode={mode}
      onModeChange={setMode}
      nnProps={{
        datasetType,
        onDatasetChange: (d) => { handleReset(); setDatasetType(d); },
        layerCount,
        onLayerCountChange: (n) => { handleReset(); setLayerCount(n); },
        neuronsPerLayer,
        onNeuronsChange: (n) => { handleReset(); setNeuronsPerLayer(n); },
        activation,
        onActivationChange: (a) => { handleReset(); setActivation(a); },
        learningRate,
        onLearningRateChange: setLearningRate,
        epochs,
        onEpochsChange: setEpochs,
        onTrain: handleTrain,
        onReset: handleReset,
        isTraining,
      }}
      pipelineProps={{
        selectedPipeline,
        onPipelineChange: handlePipelineChange,
        selectedStage,
        onStageSelect: setSelectedStage,
      }}
      servingProps={{
        servingMode,
        onServingModeChange: setServingMode,
        abSplit,
        onAbSplitChange: setAbSplit,
        pattern: servingPattern,
      }}
      abTestingProps={{
        controlRate: abControlRate,
        onControlRateChange: setAbControlRate,
        treatmentRate: abTreatmentRate,
        onTreatmentRateChange: setAbTreatmentRate,
        sampleSize: abSampleSize,
        onSampleSizeChange: setAbSampleSize,
        onRunTest: handleRunABTest,
        result: abTestResult,
      }}
      banditProps={{
        strategy: banditStrategy,
        onStrategyChange: setBanditStrategy,
        armCount: banditArmCount,
        onArmCountChange: setBanditArmCount,
        rounds: banditRounds,
        onRoundsChange: setBanditRounds,
        epsilon: banditEpsilon,
        onEpsilonChange: setBanditEpsilon,
        onRun: handleRunBandit,
        isRunning: banditIsRunning,
      }}
      featureStoreProps={{
        steps: fsSteps,
        animTick: fsAnimTick,
        isRunning: fsIsRunning,
        onRun: handleRunFeatureStore,
        onReset: handleResetFeatureStore,
      }}
    />
  );

  const canvas =
    mode === "neural-network" ? (
      <NNCanvas
        dataset={dataset}
        layerSizes={layerSizes}
        network={null}
        trainedNetwork={trainedNetwork}
        showCNNDemo={showCNNDemo}
        showDropoutDemo={showDropoutDemo}
        onToggleCNN={handleToggleCNN}
        onToggleDropout={handleToggleDropout}
      />
    ) : mode === "pipeline-builder" ? (
      <PipelineCanvas
        pipeline={selectedPipeline}
        selectedStageId={selectedStage?.id ?? null}
        onStageSelect={handleStageSelectFromCanvas}
      />
    ) : mode === "ab-testing" ? (
      <ABTestingCanvas result={abTestResult} />
    ) : mode === "experimentation" ? (
      <BanditCanvas steps={banditSteps} animTick={banditAnimTick} />
    ) : mode === "feature-store" ? (
      <FeatureStoreCanvas steps={fsSteps} animTick={fsAnimTick} />
    ) : (
      <ServingCanvas
        pattern={servingPattern}
        animTick={servingAnimTick}
      />
    );

  const properties =
    mode === "neural-network" ? (
      <NNProperties
        currentEpoch={currentEpoch}
        totalEpochs={epochs}
        loss={currentLoss}
        accuracy={currentAccuracy}
        layerSizes={layerSizes}
        paramCount={paramCount}
        lossHistory={lossHistory}
      />
    ) : mode === "pipeline-builder" ? (
      <PipelineProperties stage={selectedStage} />
    ) : mode === "ab-testing" ? (
      <ABTestingProperties result={abTestResult} />
    ) : mode === "experimentation" ? (
      <BanditProperties steps={banditSteps} animTick={banditAnimTick} />
    ) : mode === "feature-store" ? (
      <FeatureStoreProperties steps={fsSteps} animTick={fsAnimTick} />
    ) : (
      <ServingProperties
        pattern={servingPattern}
        animTick={Math.min(
          Math.floor(servingAnimTick / 8),
          servingPattern.steps.length - 1
        )}
      />
    );

  const bottomPanel =
    mode === "neural-network" ? (
      <NNBottomPanel log={trainingLog} />
    ) : mode === "pipeline-builder" ? (
      <PipelineBottomPanel pipeline={selectedPipeline} />
    ) : mode === "ab-testing" ? (
      <ABTestingBottomPanel result={abTestResult} />
    ) : mode === "experimentation" ? (
      <BanditBottomPanel steps={banditSteps} animTick={banditAnimTick} />
    ) : mode === "feature-store" ? (
      <FeatureStoreBottomPanel steps={fsSteps} animTick={fsAnimTick} />
    ) : (
      <ServingBottomPanel pattern={servingPattern} />
    );

  return { sidebar, canvas, properties, bottomPanel };
}

export const MLDesignModule = memo(function MLDesignModule() {
  return null;
});
