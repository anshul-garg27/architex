"use client";

import React, { useState, useCallback, useRef, useMemo, memo } from "react";
import { Play, Pause, RotateCcw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NeuralNetwork,
  type ActivationName,
  type LossFunctionName,
  type EpochMetrics,
  type DatasetSample,
} from "@/lib/ml-design/neural-network";
import {
  computeDecisionBoundary,
  type Bounds,
  type DecisionBoundaryResult,
} from "@/lib/ml-design/decision-boundary";
import {
  generateCircleDataset,
  generateXORDataset,
  generateMoonDataset,
  generateSpiralDataset,
  type DatasetPoint,
  type GeneratedDataset,
} from "@/lib/ml-design/dataset-generators";
import { SGDOptimizer, AdamOptimizer, RMSPropOptimizer } from "@/lib/ml-design/optimizers";
import { DecisionBoundaryCanvas } from "./DecisionBoundaryCanvas";

// ── Types ──────────────────────────────────────────────────

type DatasetType = "circle" | "xor" | "moon" | "spiral";
type OptimizerType = "sgd" | "adam" | "rmsprop";

interface TrainingDashboardProps {
  className?: string;
}

// ── Dataset factories ───────────────────────────────────────

const DATASET_FACTORIES: Record<DatasetType, (n: number) => GeneratedDataset> = {
  circle: (n) => generateCircleDataset(n, 0.08),
  xor: (n) => generateXORDataset(n, 0.15),
  moon: (n) => generateMoonDataset(n, 0.12),
  spiral: (n) => generateSpiralDataset(n, 2),
};

const DATASET_LABELS: Record<DatasetType, string> = {
  circle: "Concentric Circles",
  xor: "XOR Pattern",
  moon: "Half Moons",
  spiral: "Spiral Arms",
};

const HIDDEN_LAYER_PRESETS: Record<string, number[]> = {
  "4": [4],
  "8": [8],
  "4,4": [4, 4],
  "8,4": [8, 4],
  "8,8": [8, 8],
  "16,8": [16, 8],
  "8,8,4": [8, 8, 4],
};

const LEARNING_RATES = [0.001, 0.005, 0.01, 0.05, 0.1];
const SPEED_OPTIONS = [1, 5, 10, 25, 50];

// ── Loss curve SVG ──────────────────────────────────────────

const LossCurve = memo(function LossCurve({
  history,
  width,
  height,
}: {
  history: number[];
  width: number;
  height: number;
}) {
  if (history.length < 2) {
    return (
      <svg width={width} height={height} className="rounded border border-border bg-card">
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="#888" fontSize={12}>
          Loss curve will appear here
        </text>
      </svg>
    );
  }

  const padding = { top: 10, right: 10, bottom: 24, left: 40 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const maxLoss = Math.max(...history);
  const minLoss = Math.min(...history);
  const lossRange = maxLoss - minLoss || 1;

  const points = history.map((loss, i) => {
    const x = padding.left + (i / (history.length - 1)) * plotW;
    const y = padding.top + (1 - (loss - minLoss) / lossRange) * plotH;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} className="rounded border border-border bg-card">
      {/* Y-axis labels */}
      <text x={padding.left - 4} y={padding.top + 4} textAnchor="end" fill="#888" fontSize={10}>
        {maxLoss.toFixed(3)}
      </text>
      <text x={padding.left - 4} y={padding.top + plotH + 4} textAnchor="end" fill="#888" fontSize={10}>
        {minLoss.toFixed(3)}
      </text>
      {/* X-axis label */}
      <text x={padding.left + plotW / 2} y={height - 4} textAnchor="middle" fill="#888" fontSize={10}>
        Epoch ({history.length})
      </text>
      {/* Grid lines */}
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + plotH}
        stroke="#333"
        strokeWidth={1}
      />
      <line
        x1={padding.left}
        y1={padding.top + plotH}
        x2={padding.left + plotW}
        y2={padding.top + plotH}
        stroke="#333"
        strokeWidth={1}
      />
      {/* Loss polyline */}
      <polyline fill="none" stroke="#3b82f6" strokeWidth={1.5} points={points.join(" ")} />
    </svg>
  );
});

// ── Main Dashboard ──────────────────────────────────────────

const TrainingDashboard = memo(function TrainingDashboard({
  className,
}: TrainingDashboardProps) {
  // ── Configuration state ─────────────────────────────────
  const [datasetType, setDatasetType] = useState<DatasetType>("circle");
  const [hiddenLayersKey, setHiddenLayersKey] = useState<string>("8,4");
  const [activation, setActivation] = useState<ActivationName>("relu");
  const [lossFunction, setLossFunction] = useState<LossFunctionName>("binaryCrossEntropy");
  const [optimizerType, setOptimizerType] = useState<OptimizerType>("adam");
  const [learningRate, setLearningRate] = useState<number>(0.01);
  const [speed, setSpeed] = useState<number>(5);

  // ── Training state ──────────────────────────────────────
  const [isTraining, setIsTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [currentLoss, setCurrentLoss] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [lossHistory, setLossHistory] = useState<number[]>([]);
  const [boundaryData, setBoundaryData] = useState<DecisionBoundaryResult | null>(null);

  // ── Refs for animation loop ─────────────────────────────
  const networkRef = useRef<NeuralNetwork | null>(null);
  const datasetRef = useRef<{ samples: DatasetSample[]; points: DatasetPoint[]; bounds: Bounds } | null>(null);
  const animFrameRef = useRef<number>(0);
  const isTrainingRef = useRef(false);

  // ── Data points for the canvas overlay ──────────────────
  const [dataPoints, setDataPoints] = useState<DatasetPoint[]>([]);

  // ── Initialize network and dataset ──────────────────────
  const initializeAll = useCallback(() => {
    // Generate dataset
    const generated = DATASET_FACTORIES[datasetType](200);
    const samples: DatasetSample[] = generated.points
      .filter((p) => p.label === 0 || p.label === 1)
      .map((p) => ({
        input: [p.x, p.y],
        target: [p.label],
      }));

    const bounds = generated.bounds;

    datasetRef.current = {
      samples,
      points: generated.points.filter((p) => p.label === 0 || p.label === 1),
      bounds,
    };
    setDataPoints(datasetRef.current.points);

    // Build layer sizes: [2, ...hidden, 1]
    const hidden = HIDDEN_LAYER_PRESETS[hiddenLayersKey] ?? [8, 4];
    const layerSizes = [2, ...hidden, 1];

    networkRef.current = new NeuralNetwork(layerSizes, activation);

    // Reset metrics
    setEpoch(0);
    setCurrentLoss(0);
    setAccuracy(0);
    setLossHistory([]);
    setBoundaryData(null);
  }, [datasetType, hiddenLayersKey, activation]);

  // ── Create optimizer instance ───────────────────────────
  const createOptimizer = useCallback(() => {
    switch (optimizerType) {
      case "sgd":
        return new SGDOptimizer(learningRate, 0.9);
      case "adam":
        return new AdamOptimizer(learningRate);
      case "rmsprop":
        return new RMSPropOptimizer(learningRate);
    }
  }, [optimizerType, learningRate]);

  // ── Training loop via requestAnimationFrame ─────────────
  const runTrainingStep = useCallback(() => {
    if (!isTrainingRef.current) return;
    if (!networkRef.current || !datasetRef.current) return;

    const network = networkRef.current;
    const { samples, bounds } = datasetRef.current;
    const optimizer = createOptimizer();

    // Run `speed` epochs per animation frame
    let lastMetrics: EpochMetrics | null = null;
    const newLossEntries: number[] = [];

    network.train(samples, {
      epochs: speed,
      learningRate,
      optimizer,
      lossFunction,
      onEpoch: (metrics) => {
        lastMetrics = metrics;
        newLossEntries.push(metrics.loss);
      },
    });

    if (lastMetrics !== null) {
      const m = lastMetrics as EpochMetrics;
      setEpoch((prev) => prev + speed);
      setCurrentLoss(m.loss);
      setAccuracy(m.accuracy);
      setLossHistory((prev) => [...prev, ...newLossEntries]);

      // Recompute decision boundary
      const boundary = computeDecisionBoundary(network, bounds, 50);
      setBoundaryData(boundary);
    }

    animFrameRef.current = requestAnimationFrame(runTrainingStep);
  }, [speed, learningRate, lossFunction, createOptimizer]);

  // ── Controls ────────────────────────────────────────────
  const handleStart = useCallback(() => {
    if (!networkRef.current) {
      initializeAll();
    }
    isTrainingRef.current = true;
    setIsTraining(true);
    animFrameRef.current = requestAnimationFrame(runTrainingStep);
  }, [initializeAll, runTrainingStep]);

  const handlePause = useCallback(() => {
    isTrainingRef.current = false;
    setIsTraining(false);
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const handleReset = useCallback(() => {
    isTrainingRef.current = false;
    setIsTraining(false);
    cancelAnimationFrame(animFrameRef.current);
    initializeAll();
  }, [initializeAll]);

  // ── Derived display values ──────────────────────────────
  const paramCount = useMemo(() => {
    if (!networkRef.current) {
      const hidden = HIDDEN_LAYER_PRESETS[hiddenLayersKey] ?? [8, 4];
      const sizes = [2, ...hidden, 1];
      let total = 0;
      for (let i = 0; i < sizes.length - 1; i++) {
        total += sizes[i] * sizes[i + 1] + sizes[i + 1];
      }
      return total;
    }
    return networkRef.current.paramCount();
  }, [hiddenLayersKey]);

  return (
    <div className={cn("flex flex-col gap-4 lg:flex-row", className)}>
      {/* Left panel: Visualization */}
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Decision Boundary
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <DecisionBoundaryCanvas
            boundaryData={boundaryData}
            dataPoints={dataPoints}
            width={400}
            height={400}
            className="rounded-lg"
          />
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
              Class 0
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
              Class 1
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-white border border-border" />
              Boundary
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Right panel: Controls + Metrics */}
      <div className="flex w-full flex-col gap-4 lg:w-80">
        {/* Training controls */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Controls</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex gap-2">
              {!isTraining ? (
                <Button size="sm" onClick={handleStart} className="flex-1">
                  <Play className="mr-1 h-3 w-3" />
                  {epoch > 0 ? "Resume" : "Start"}
                </Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={handlePause} className="flex-1">
                  <Pause className="mr-1 h-3 w-3" />
                  Pause
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleReset}>
                <RotateCcw className="mr-1 h-3 w-3" />
                Reset
              </Button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 rounded-md border border-border p-2 text-center text-xs">
              <div>
                <div className="text-muted-foreground">Epoch</div>
                <div className="font-mono font-semibold">{epoch}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Loss</div>
                <div className="font-mono font-semibold">{currentLoss.toFixed(4)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Accuracy</div>
                <div className="font-mono font-semibold">{(accuracy * 100).toFixed(1)}%</div>
              </div>
            </div>

            {/* Loss curve */}
            <LossCurve history={lossHistory} width={280} height={120} />
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {/* Dataset */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Dataset</Label>
              <Select
                value={datasetType}
                onValueChange={(v) => {
                  setDatasetType(v as DatasetType);
                  handleReset();
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DATASET_LABELS) as DatasetType[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {DATASET_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hidden Layers */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Hidden Layers</Label>
              <Select value={hiddenLayersKey} onValueChange={setHiddenLayersKey}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(HIDDEN_LAYER_PRESETS).map(([key, sizes]) => (
                    <SelectItem key={key} value={key}>
                      [{sizes.join(", ")}] ({paramCount} params)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Activation */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Activation</Label>
              <Select value={activation} onValueChange={(v) => setActivation(v as ActivationName)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relu">ReLU</SelectItem>
                  <SelectItem value="sigmoid">Sigmoid</SelectItem>
                  <SelectItem value="tanh">Tanh</SelectItem>
                  <SelectItem value="leakyRelu">Leaky ReLU</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loss Function */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Loss Function</Label>
              <Select value={lossFunction} onValueChange={(v) => setLossFunction(v as LossFunctionName)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mse">Mean Squared Error</SelectItem>
                  <SelectItem value="binaryCrossEntropy">Binary Cross-Entropy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Optimizer */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Optimizer</Label>
              <Select value={optimizerType} onValueChange={(v) => setOptimizerType(v as OptimizerType)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sgd">SGD + Momentum</SelectItem>
                  <SelectItem value="adam">Adam</SelectItem>
                  <SelectItem value="rmsprop">RMSProp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Learning Rate */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Learning Rate</Label>
              <Select
                value={String(learningRate)}
                onValueChange={(v) => setLearningRate(Number(v))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEARNING_RATES.map((lr) => (
                    <SelectItem key={lr} value={String(lr)}>
                      {lr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Speed */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Speed (epochs/frame)</Label>
              <Select value={String(speed)} onValueChange={(v) => setSpeed(Number(v))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPEED_OPTIONS.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export { TrainingDashboard };
