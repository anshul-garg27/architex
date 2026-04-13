"use client";

import React, { useState, useCallback, useMemo, memo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  simulateCNNForward,
  type CNNLayer,
  type TensorDims,
  type ForwardStep,
  type CNNForwardResult,
  PRESET_LENET,
  PRESET_SMALL_VGG,
  PRESET_TINY,
} from "@/lib/ml-design/cnn-forward";

// ── Constants ────────────────────────────────────────────────

const LAYER_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  conv2d:  { fill: "#3b82f6", stroke: "#2563eb", text: "#ffffff" },
  maxpool: { fill: "#f59e0b", stroke: "#d97706", text: "#1a1a1a" },
  avgpool: { fill: "#f97316", stroke: "#ea580c", text: "#1a1a1a" },
  flatten: { fill: "#8b5cf6", stroke: "#7c3aed", text: "#ffffff" },
  dense:   { fill: "#10b981", stroke: "#059669", text: "#ffffff" },
};

const PRESETS: Record<string, { layers: CNNLayer[]; input: TensorDims; label: string }> = {
  lenet: {
    layers: PRESET_LENET,
    input: { height: 28, width: 28, channels: 1 },
    label: "LeNet-5 (28x28x1)",
  },
  vgg: {
    layers: PRESET_SMALL_VGG,
    input: { height: 32, width: 32, channels: 3 },
    label: "Small VGG (32x32x3)",
  },
  tiny: {
    layers: PRESET_TINY,
    input: { height: 16, width: 16, channels: 1 },
    label: "Tiny CNN (16x16x1)",
  },
};

// ── Types ────────────────────────────────────────────────────

interface CNNVisualizerProps {
  /** Optional custom layers to visualise instead of presets. */
  layers?: CNNLayer[];
  /** Input dimensions for custom layers. */
  inputSize?: TensorDims;
  /** CSS class name. */
  className?: string;
}

// ── Isometric block drawing helpers ──────────────────────────

interface BlockDims {
  w: number; // visual width (proportional to spatial W)
  h: number; // visual height (proportional to spatial H)
  d: number; // visual depth (proportional to channels)
}

/**
 * Scale tensor dimensions to visual block sizes.
 * We use log scaling to keep very different sizes manageable.
 */
function dimsToBlock(dims: TensorDims): BlockDims {
  const scale = (v: number, min: number, max: number) =>
    min + (max - min) * Math.min(1, Math.log2(v + 1) / 8);

  return {
    w: scale(dims.width, 20, 70),
    h: scale(dims.height, 20, 70),
    d: scale(dims.channels, 8, 40),
  };
}

function formatDims(dims: TensorDims): string {
  if (dims.width === 1 && dims.channels === 1) {
    return `${dims.height}`;
  }
  return `${dims.height}x${dims.width}x${dims.channels}`;
}

function formatParams(count: number): string {
  if (count === 0) return "0";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

// ── Canvas drawing ───────────────────────────────────────────

interface LayerRect {
  x: number;
  y: number;
  blockW: number;
  blockH: number;
  blockD: number;
  step: ForwardStep;
}

function drawCNNArchitecture(
  ctx: CanvasRenderingContext2D,
  result: CNNForwardResult,
  canvasWidth: number,
  canvasHeight: number,
  selectedIndex: number | null,
  animProgress: number, // 0..steps.length for animation
): LayerRect[] {
  const { steps } = result;
  const layerRects: LayerRect[] = [];

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Background
  ctx.fillStyle = "#0f1117";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  if (steps.length === 0) return layerRects;

  // Layout: horizontal chain of blocks with arrows
  const padding = 40;
  const arrowGap = 28;

  // Compute block sizes for all layers (including input)
  const inputBlock = dimsToBlock(result.inputDims);
  const blocks: BlockDims[] = steps.map((s) => dimsToBlock(s.outputDims));

  // Total width needed
  const totalBlockWidth =
    inputBlock.w +
    blocks.reduce((sum, b) => sum + b.w, 0) +
    (blocks.length) * arrowGap;

  const scale = Math.min(1, (canvasWidth - 2 * padding) / totalBlockWidth);
  const yCenter = canvasHeight / 2;

  // Draw input block
  let xCursor = padding;

  const drawBlock = (
    x: number,
    block: BlockDims,
    label: string,
    dims: string,
    params: string,
    layerType: string,
    index: number,
    isAnimated: boolean,
    isSelected: boolean,
  ): { x: number; w: number } => {
    const w = block.w * scale;
    const h = block.h * scale;
    const d = block.d * scale;
    const bx = x;
    const by = yCenter - h / 2;

    const colors = LAYER_COLORS[layerType] ?? LAYER_COLORS.dense;

    // Isometric offset for 3D look
    const isoX = d * 0.5;
    const isoY = d * 0.35;

    const alpha = isAnimated ? 1.0 : 0.35;

    // Side face (right)
    ctx.fillStyle = adjustAlpha(darken(colors.fill, 0.3), alpha);
    ctx.beginPath();
    ctx.moveTo(bx + w, by);
    ctx.lineTo(bx + w + isoX, by - isoY);
    ctx.lineTo(bx + w + isoX, by - isoY + h);
    ctx.lineTo(bx + w, by + h);
    ctx.closePath();
    ctx.fill();

    // Top face
    ctx.fillStyle = adjustAlpha(lighten(colors.fill, 0.15), alpha);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + isoX, by - isoY);
    ctx.lineTo(bx + w + isoX, by - isoY);
    ctx.lineTo(bx + w, by);
    ctx.closePath();
    ctx.fill();

    // Front face
    ctx.fillStyle = adjustAlpha(colors.fill, alpha);
    ctx.fillRect(bx, by, w, h);

    // Borders
    ctx.strokeStyle = isSelected
      ? "#ffffff"
      : adjustAlpha(colors.stroke, alpha);
    ctx.lineWidth = isSelected ? 2 : 1;

    // Front border
    ctx.strokeRect(bx, by, w, h);

    // Side border
    ctx.beginPath();
    ctx.moveTo(bx + w, by);
    ctx.lineTo(bx + w + isoX, by - isoY);
    ctx.lineTo(bx + w + isoX, by - isoY + h);
    ctx.lineTo(bx + w, by + h);
    ctx.stroke();

    // Top border
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + isoX, by - isoY);
    ctx.lineTo(bx + w + isoX, by - isoY);
    ctx.lineTo(bx + w, by);
    ctx.stroke();

    // Label text
    ctx.fillStyle = adjustAlpha(colors.text, alpha);
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, bx + w / 2, by + h / 2 - 4);

    // Dimensions below label
    ctx.font = "9px system-ui, sans-serif";
    ctx.fillStyle = adjustAlpha(colors.text, alpha * 0.85);
    ctx.fillText(dims, bx + w / 2, by + h / 2 + 8);

    // Parameter count below block
    if (params !== "0") {
      ctx.font = "8px system-ui, sans-serif";
      ctx.fillStyle = adjustAlpha("#9ca3af", alpha);
      ctx.fillText(`${params} params`, bx + w / 2, by + h + 14);
    }

    return { x: bx, w: w + isoX };
  };

  // Draw input block
  const inputDrawn = drawBlock(
    xCursor,
    inputBlock,
    "Input",
    formatDims(result.inputDims),
    "0",
    "conv2d",
    -1,
    animProgress >= 0,
    selectedIndex === -1,
  );

  layerRects.push({
    x: xCursor,
    y: yCenter - inputBlock.h * scale / 2,
    blockW: inputBlock.w * scale + inputBlock.d * scale * 0.5,
    blockH: inputBlock.h * scale,
    blockD: inputBlock.d * scale,
    step: {
      layerIndex: -1,
      layer: { type: "conv2d", filters: 0, kernelSize: 0, stride: 0, padding: 0 },
      typeLabel: "Input",
      inputDims: result.inputDims,
      outputDims: result.inputDims,
      paramCount: 0,
      description: `Input tensor: ${formatDims(result.inputDims)}`,
    },
  });

  xCursor += inputDrawn.w + arrowGap * scale;

  // Draw each layer with arrows
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const block = blocks[i];
    const isAnimated = animProgress > i;
    const isSelected = selectedIndex === i;

    // Draw arrow from previous block
    const arrowY = yCenter;
    const arrowStart = xCursor - arrowGap * scale + 2;
    const arrowEnd = xCursor - 2;

    ctx.strokeStyle = isAnimated ? "#4b5563" : "#2a2a3a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(arrowStart, arrowY);
    ctx.lineTo(arrowEnd, arrowY);
    ctx.stroke();

    // Arrowhead
    ctx.fillStyle = isAnimated ? "#4b5563" : "#2a2a3a";
    ctx.beginPath();
    ctx.moveTo(arrowEnd, arrowY);
    ctx.lineTo(arrowEnd - 5, arrowY - 3);
    ctx.lineTo(arrowEnd - 5, arrowY + 3);
    ctx.closePath();
    ctx.fill();

    // Animated "data" dot flowing through arrow
    if (animProgress > i && animProgress <= i + 1) {
      const dotFrac = animProgress - i;
      const dotX = arrowStart + (arrowEnd - arrowStart) * dotFrac;
      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.arc(dotX, arrowY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const drawn = drawBlock(
      xCursor,
      block,
      step.typeLabel,
      formatDims(step.outputDims),
      formatParams(step.paramCount),
      step.layer.type,
      i,
      isAnimated,
      isSelected,
    );

    layerRects.push({
      x: xCursor,
      y: yCenter - block.h * scale / 2,
      blockW: drawn.w,
      blockH: block.h * scale,
      blockD: block.d * scale,
      step,
    });

    xCursor += drawn.w + arrowGap * scale;
  }

  return layerRects;
}

// ── Color helpers ────────────────────────────────────────────

function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * (1 - amount))},${Math.round(g * (1 - amount))},${Math.round(b * (1 - amount))})`;
}

function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`;
}

function adjustAlpha(color: string, alpha: number): string {
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `,${alpha})`);
  }
  return color;
}

// ── Details panel ────────────────────────────────────────────

const LayerDetails = memo(function LayerDetails({
  step,
}: {
  step: ForwardStep;
}) {
  const colors = LAYER_COLORS[step.layer.type] ?? LAYER_COLORS.dense;

  return (
    <div className="rounded-lg border border-border bg-card p-3 text-xs">
      <div className="mb-2 flex items-center gap-2">
        <div
          className="h-3 w-3 rounded"
          style={{ backgroundColor: colors.fill }}
        />
        <span className="font-semibold">{step.typeLabel}</span>
        <span className="text-muted-foreground">Layer {step.layerIndex}</span>
      </div>

      <div className="space-y-1 text-muted-foreground">
        <div>
          <span className="font-medium text-foreground">Input: </span>
          {formatDims(step.inputDims)}
        </div>
        <div>
          <span className="font-medium text-foreground">Output: </span>
          {formatDims(step.outputDims)}
        </div>
        <div>
          <span className="font-medium text-foreground">Parameters: </span>
          {step.paramCount.toLocaleString()}
        </div>
        <div className="mt-2 rounded bg-muted/50 p-2 font-mono text-[10px]">
          {step.description}
        </div>

        {/* Layer-specific details */}
        {step.layer.type === "conv2d" && (
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div>Kernel: {step.layer.kernelSize}x{step.layer.kernelSize}</div>
            <div>Stride: {step.layer.stride}</div>
            <div>Padding: {step.layer.padding}</div>
            <div>Filters: {step.layer.filters}</div>
          </div>
        )}
        {(step.layer.type === "maxpool" || step.layer.type === "avgpool") && (
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div>Pool: {step.layer.poolSize}x{step.layer.poolSize}</div>
            <div>Stride: {step.layer.stride}</div>
          </div>
        )}
        {step.layer.type === "dense" && (
          <div className="mt-1">
            Units: {step.layer.units}
          </div>
        )}
      </div>
    </div>
  );
});

// ── Main component ───────────────────────────────────────────

const CNNVisualizer = memo(function CNNVisualizer({
  layers: customLayers,
  inputSize: customInput,
  className,
}: CNNVisualizerProps) {
  const [preset, setPreset] = useState<string>("lenet");
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layerRectsRef = useRef<LayerRect[]>([]);
  const animFrameRef = useRef<number>(0);

  // Resolve layers/input from props or preset
  const { layers, inputSize } = useMemo(() => {
    if (customLayers && customInput) {
      return { layers: customLayers, inputSize: customInput };
    }
    const p = PRESETS[preset];
    return { layers: p.layers, inputSize: p.input };
  }, [customLayers, customInput, preset]);

  // Compute forward pass result
  const forwardResult = useMemo(() => {
    try {
      return simulateCNNForward(layers, inputSize);
    } catch {
      return null;
    }
  }, [layers, inputSize]);

  const totalSteps = forwardResult?.steps.length ?? 0;

  // Canvas dimensions
  const canvasWidth = 800;
  const canvasHeight = 240;

  // Draw the canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !forwardResult) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    layerRectsRef.current = drawCNNArchitecture(
      ctx,
      forwardResult,
      canvasWidth,
      canvasHeight,
      selectedLayer,
      isAnimating ? animProgress : totalSteps,
    );
  }, [forwardResult, canvasWidth, canvasHeight, selectedLayer, isAnimating, animProgress, totalSteps]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Handle canvas click for layer selection
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      // Check if click is inside any layer block
      for (const lr of layerRectsRef.current) {
        if (
          mx >= lr.x &&
          mx <= lr.x + lr.blockW &&
          my >= lr.y &&
          my <= lr.y + lr.blockH
        ) {
          setSelectedLayer(
            lr.step.layerIndex === selectedLayer ? null : lr.step.layerIndex,
          );
          return;
        }
      }

      setSelectedLayer(null);
    },
    [selectedLayer, canvasWidth, canvasHeight],
  );

  // Animation
  const startAnimation = useCallback(() => {
    setIsAnimating(true);
    setAnimProgress(0);

    const startTime = performance.now();
    const duration = totalSteps * 400; // 400ms per layer

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(totalSteps, (elapsed / duration) * totalSteps);
      setAnimProgress(progress);

      if (progress < totalSteps) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [totalSteps]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Get selected layer details
  const selectedStep = useMemo(() => {
    if (selectedLayer === null || !forwardResult) return null;
    if (selectedLayer === -1) {
      return layerRectsRef.current[0]?.step ?? null;
    }
    return forwardResult.steps[selectedLayer] ?? null;
  }, [selectedLayer, forwardResult]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        {!customLayers && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Architecture:</label>
            <select
              value={preset}
              onChange={(e) => {
                setPreset(e.target.value);
                setSelectedLayer(null);
              }}
              className="h-7 rounded border border-border bg-card px-2 text-xs"
            >
              {Object.entries(PRESETS).map(([key, p]) => (
                <option key={key} value={key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={startAnimation}
          disabled={isAnimating}
          className={cn(
            "h-7 rounded border border-border bg-card px-3 text-xs",
            "hover:bg-muted disabled:opacity-50",
          )}
        >
          {isAnimating ? "Running..." : "Animate Forward Pass"}
        </button>

        {forwardResult && (
          <span className="ml-auto text-xs text-muted-foreground">
            Total: {formatParams(forwardResult.totalParams)} params
            {" | "}
            {forwardResult.steps.length} layers
          </span>
        )}
      </div>

      {/* Canvas */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={handleCanvasClick}
          className="cursor-pointer"
          style={{ width: "100%", height: "auto" }}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(LAYER_COLORS).map(([type, colors]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded"
              style={{ backgroundColor: colors.fill }}
            />
            {type === "conv2d" ? "Conv2D" :
             type === "maxpool" ? "MaxPool" :
             type === "avgpool" ? "AvgPool" :
             type === "flatten" ? "Flatten" :
             "Dense"}
          </span>
        ))}
        <span className="ml-2 italic">Click a layer for details</span>
      </div>

      {/* Layer details panel */}
      {selectedStep && <LayerDetails step={selectedStep} />}

      {/* Error display */}
      {!forwardResult && (
        <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          Invalid layer configuration. Check that dimensions are compatible.
        </div>
      )}
    </div>
  );
});

export { CNNVisualizer };
