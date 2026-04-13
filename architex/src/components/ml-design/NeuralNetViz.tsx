"use client";

import React, { useState, useCallback, useMemo, memo } from "react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────

export interface NeuronState {
  /** Activation value in [0, 1]. */
  activation: number;
  /** Whether this neuron is highlighted during forward pass. */
  active: boolean;
}

export interface ConnectionWeight {
  fromLayer: number;
  fromNeuron: number;
  toLayer: number;
  toNeuron: number;
  weight: number;
}

export interface LayerConfig {
  neuronCount: number;
  label?: string;
}

export interface NeuralNetVizProps {
  /** 2-5 layers, each with up to 10 neurons. */
  layers: LayerConfig[];
  /** Optional connection weights (default: random in [-1, 1]). */
  weights?: ConnectionWeight[];
  /** Optional neuron states for forward-pass highlighting. */
  neuronStates?: NeuronState[][];
  /** Labels for input neurons. */
  inputLabels?: string[];
  /** Labels for output neurons. */
  outputLabels?: string[];
  /** Animate a forward pass step-by-step. */
  animateForwardPass?: boolean;
  /** CSS class name. */
  className?: string;
}

// ── Constants ────────────────────────────────────────────────

const SVG_WIDTH = 800;
const SVG_HEIGHT = 400;
const NEURON_RADIUS = 14;
const LAYER_PADDING_X = 100;
const NEURON_SPACING_Y = 38;
const MIN_LAYERS = 2;
const MAX_LAYERS = 5;
const MAX_NEURONS_PER_LAYER = 10;

const LAYER_COLORS = [
  "#3b82f6", // blue — input
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red — output
];

// ── Helpers ──────────────────────────────────────────────────

function clampLayers(layers: LayerConfig[]): LayerConfig[] {
  const clamped = layers.slice(0, MAX_LAYERS);
  if (clamped.length < MIN_LAYERS) {
    while (clamped.length < MIN_LAYERS) {
      clamped.push({ neuronCount: 1 });
    }
  }
  return clamped.map((l) => ({
    ...l,
    neuronCount: Math.min(MAX_NEURONS_PER_LAYER, Math.max(1, l.neuronCount)),
  }));
}

function weightToColor(weight: number): string {
  // Positive weights: blue, negative weights: red, zero: grey
  const clamped = Math.max(-1, Math.min(1, weight));
  if (clamped >= 0) {
    const intensity = Math.round(clamped * 200);
    return `rgb(${100 - intensity / 2}, ${100 + intensity / 2}, ${200 + Math.round(clamped * 55)})`;
  }
  const intensity = Math.round(Math.abs(clamped) * 200);
  return `rgb(${200 + Math.round(Math.abs(clamped) * 55)}, ${100 - intensity / 2}, ${100 - intensity / 2})`;
}

function weightToThickness(weight: number): number {
  return 0.5 + Math.abs(weight) * 2.5;
}

/** Seeded pseudorandom for deterministic default weights. */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s / 2147483647) * 2 - 1; // [-1, 1]
  };
}

function getNeuronPosition(
  layerIndex: number,
  neuronIndex: number,
  totalInLayer: number,
  totalLayers: number,
): { cx: number; cy: number } {
  const usableWidth = SVG_WIDTH - 2 * LAYER_PADDING_X;
  const layerSpacing = totalLayers > 1 ? usableWidth / (totalLayers - 1) : 0;
  const cx = LAYER_PADDING_X + layerIndex * layerSpacing;

  const totalHeight = (totalInLayer - 1) * NEURON_SPACING_Y;
  const startY = SVG_HEIGHT / 2 - totalHeight / 2;
  const cy = startY + neuronIndex * NEURON_SPACING_Y;

  return { cx, cy };
}

// ── Sub-components ───────────────────────────────────────────

interface ConnectionLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  weight: number;
  active: boolean;
}

const ConnectionLine = memo(function ConnectionLine({
  x1,
  y1,
  x2,
  y2,
  weight,
  active,
}: ConnectionLineProps) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={active ? "#fbbf24" : weightToColor(weight)}
      strokeWidth={weightToThickness(weight)}
      opacity={active ? 0.9 : 0.35}
      strokeLinecap="round"
    />
  );
});

interface NeuronCircleProps {
  cx: number;
  cy: number;
  active: boolean;
  activation: number;
  layerColor: string;
  label?: string;
  onHover: (info: string | null) => void;
}

const NeuronCircle = memo(function NeuronCircle({
  cx,
  cy,
  active,
  activation,
  layerColor,
  label,
  onHover,
}: NeuronCircleProps) {
  const fillOpacity = 0.3 + activation * 0.7;
  const hoverText = label
    ? `${label} (activation: ${activation.toFixed(3)})`
    : `activation: ${activation.toFixed(3)}`;

  return (
    <g
      onMouseEnter={() => onHover(hoverText)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Glow ring for active neurons */}
      {active && (
        <circle
          cx={cx}
          cy={cy}
          r={NEURON_RADIUS + 4}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={2}
          opacity={0.7}
        >
          <animate
            attributeName="opacity"
            values="0.7;0.3;0.7"
            dur="1.2s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Neuron body */}
      <circle
        cx={cx}
        cy={cy}
        r={NEURON_RADIUS}
        fill={layerColor}
        fillOpacity={fillOpacity}
        stroke={active ? "#fbbf24" : layerColor}
        strokeWidth={active ? 2 : 1.5}
      />

      {/* Activation bar (tiny inner indicator) */}
      {activation > 0.01 && (
        <circle
          cx={cx}
          cy={cy}
          r={NEURON_RADIUS * 0.4 * activation}
          fill="#ffffff"
          opacity={0.6}
        />
      )}
    </g>
  );
});

// ── Main component ───────────────────────────────────────────

const NeuralNetViz = memo(function NeuralNetViz({
  layers: rawLayers,
  weights: customWeights,
  neuronStates,
  inputLabels,
  outputLabels,
  animateForwardPass = false,
  className,
}: NeuralNetVizProps) {
  const [hoverInfo, setHoverInfo] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<number>(-1);

  const layers = useMemo(() => clampLayers(rawLayers), [rawLayers]);
  const totalLayers = layers.length;

  // Build connection weights (use custom or generate deterministic defaults)
  const connections = useMemo(() => {
    if (customWeights) return customWeights;

    const rand = seededRandom(42);
    const result: ConnectionWeight[] = [];
    for (let li = 0; li < layers.length - 1; li++) {
      const fromCount = layers[li].neuronCount;
      const toCount = layers[li + 1].neuronCount;
      for (let fi = 0; fi < fromCount; fi++) {
        for (let ti = 0; ti < toCount; ti++) {
          result.push({
            fromLayer: li,
            fromNeuron: fi,
            toLayer: li + 1,
            toNeuron: ti,
            weight: rand(),
          });
        }
      }
    }
    return result;
  }, [layers, customWeights]);

  // Build neuron state map
  const stateMap = useMemo(() => {
    if (neuronStates) return neuronStates;
    return layers.map((layer) =>
      Array.from({ length: layer.neuronCount }, () => ({
        activation: 0.5,
        active: false,
      })),
    );
  }, [layers, neuronStates]);

  // Forward pass animation state
  const handleAnimate = useCallback(() => {
    if (!animateForwardPass) return;
    let step = 0;
    const interval = setInterval(() => {
      setActiveLayer(step);
      step++;
      if (step > totalLayers) {
        setActiveLayer(-1);
        clearInterval(interval);
      }
    }, 600);
  }, [animateForwardPass, totalLayers]);

  // Determine if a neuron is "active" in animation
  const isNeuronActive = useCallback(
    (layerIdx: number, neuronIdx: number): boolean => {
      if (activeLayer >= 0 && layerIdx <= activeLayer) return true;
      const state = stateMap[layerIdx]?.[neuronIdx];
      return state?.active ?? false;
    },
    [activeLayer, stateMap],
  );

  const isConnectionActive = useCallback(
    (fromLayer: number, toLayer: number): boolean => {
      if (activeLayer >= 0) {
        return fromLayer < activeLayer && toLayer <= activeLayer;
      }
      return false;
    },
    [activeLayer],
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {totalLayers} layers | {layers.reduce((s, l) => s + l.neuronCount, 0)} neurons | {connections.length} connections
        </span>

        {animateForwardPass && (
          <button
            onClick={handleAnimate}
            disabled={activeLayer >= 0}
            className={cn(
              "h-7 rounded border border-border bg-card px-3 text-xs",
              "hover:bg-muted disabled:opacity-50",
            )}
          >
            {activeLayer >= 0 ? "Running..." : "Animate Forward Pass"}
          </button>
        )}

        {hoverInfo && (
          <span className="ml-auto text-xs text-muted-foreground">
            {hoverInfo}
          </span>
        )}
      </div>

      {/* SVG canvas */}
      <div className="overflow-x-auto rounded-lg border border-border bg-[#0f1117]">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full"
          style={{ minWidth: 500 }}
        >
          {/* Connections */}
          {connections.map((conn, idx) => {
            const from = getNeuronPosition(
              conn.fromLayer,
              conn.fromNeuron,
              layers[conn.fromLayer].neuronCount,
              totalLayers,
            );
            const to = getNeuronPosition(
              conn.toLayer,
              conn.toNeuron,
              layers[conn.toLayer].neuronCount,
              totalLayers,
            );
            return (
              <ConnectionLine
                key={idx}
                x1={from.cx}
                y1={from.cy}
                x2={to.cx}
                y2={to.cy}
                weight={conn.weight}
                active={isConnectionActive(conn.fromLayer, conn.toLayer)}
              />
            );
          })}

          {/* Neurons */}
          {layers.map((layer, li) =>
            Array.from({ length: layer.neuronCount }, (_, ni) => {
              const { cx, cy } = getNeuronPosition(
                li,
                ni,
                layer.neuronCount,
                totalLayers,
              );
              const state = stateMap[li]?.[ni];
              const layerColor = LAYER_COLORS[li % LAYER_COLORS.length];

              // Determine label for input/output neurons
              let label: string | undefined;
              if (li === 0 && inputLabels?.[ni]) {
                label = inputLabels[ni];
              } else if (li === totalLayers - 1 && outputLabels?.[ni]) {
                label = outputLabels[ni];
              }

              return (
                <NeuronCircle
                  key={`${li}-${ni}`}
                  cx={cx}
                  cy={cy}
                  active={isNeuronActive(li, ni)}
                  activation={state?.activation ?? 0.5}
                  layerColor={layerColor}
                  label={label}
                  onHover={setHoverInfo}
                />
              );
            }),
          )}

          {/* Layer labels */}
          {layers.map((layer, li) => {
            const { cx } = getNeuronPosition(li, 0, layer.neuronCount, totalLayers);
            const labelText =
              layer.label ??
              (li === 0
                ? "Input"
                : li === totalLayers - 1
                  ? "Output"
                  : `Hidden ${li}`);
            return (
              <text
                key={`label-${li}`}
                x={cx}
                y={SVG_HEIGHT - 12}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize={11}
                fontFamily="system-ui, sans-serif"
              >
                {labelText}
              </text>
            );
          })}

          {/* Input labels (left side) */}
          {inputLabels?.map((label, ni) => {
            if (ni >= layers[0].neuronCount) return null;
            const { cx, cy } = getNeuronPosition(0, ni, layers[0].neuronCount, totalLayers);
            return (
              <text
                key={`in-${ni}`}
                x={cx - NEURON_RADIUS - 8}
                y={cy + 4}
                textAnchor="end"
                fill="#9ca3af"
                fontSize={10}
                fontFamily="system-ui, sans-serif"
              >
                {label}
              </text>
            );
          })}

          {/* Output labels (right side) */}
          {outputLabels?.map((label, ni) => {
            if (ni >= layers[totalLayers - 1].neuronCount) return null;
            const { cx, cy } = getNeuronPosition(
              totalLayers - 1,
              ni,
              layers[totalLayers - 1].neuronCount,
              totalLayers,
            );
            return (
              <text
                key={`out-${ni}`}
                x={cx + NEURON_RADIUS + 8}
                y={cy + 4}
                textAnchor="start"
                fill="#9ca3af"
                fontSize={10}
                fontFamily="system-ui, sans-serif"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 rounded" style={{ backgroundColor: weightToColor(1) }} />
          Positive weight
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 rounded" style={{ backgroundColor: weightToColor(-1) }} />
          Negative weight
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full border-2"
            style={{ borderColor: "#fbbf24", backgroundColor: "transparent" }}
          />
          Active neuron
        </span>
        <span className="ml-auto italic">
          Line thickness = |weight|
        </span>
      </div>
    </div>
  );
});

export { NeuralNetViz };
