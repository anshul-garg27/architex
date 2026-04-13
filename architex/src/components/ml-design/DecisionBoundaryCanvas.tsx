"use client";

import React, { useRef, useEffect, memo, useCallback } from "react";
import type { DecisionBoundaryResult } from "@/lib/ml-design/decision-boundary";
import type { DatasetPoint } from "@/lib/ml-design/dataset-generators";

// ── Types ──────────────────────────────────────────────────

export interface DecisionBoundaryCanvasProps {
  /** Grid of predictions from computeDecisionBoundary. */
  boundaryData: DecisionBoundaryResult | null;
  /** Dataset points to overlay on the heatmap. */
  dataPoints: DatasetPoint[];
  /** Canvas width in pixels (default 400). */
  width?: number;
  /** Canvas height in pixels (default 400). */
  height?: number;
  className?: string;
}

// ── Color helpers ───────────────────────────────────────────

/**
 * Map a prediction value [0, 1] to a color:
 *   0.0 = blue (class 0)
 *   0.5 = white (boundary)
 *   1.0 = red (class 1)
 *
 * Uses smooth interpolation through white at the midpoint.
 */
function predictionToColor(value: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, value));

  if (clamped <= 0.5) {
    // Blue to white: interpolate from (30, 100, 220) to (255, 255, 255)
    const t = clamped * 2; // 0..1
    return [
      Math.round(30 + (255 - 30) * t),
      Math.round(100 + (255 - 100) * t),
      Math.round(220 + (255 - 220) * t),
    ];
  }

  // White to red: interpolate from (255, 255, 255) to (220, 50, 50)
  const t = (clamped - 0.5) * 2; // 0..1
  return [
    Math.round(255 + (220 - 255) * t),
    Math.round(255 + (50 - 255) * t),
    Math.round(255 + (50 - 255) * t),
  ];
}

// ── Component ───────────────────────────────────────────────

const DecisionBoundaryCanvas = memo(function DecisionBoundaryCanvas({
  boundaryData,
  dataPoints,
  width = 400,
  height = 400,
  className,
}: DecisionBoundaryCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background if no data yet
    if (!boundaryData) {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#888";
      ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Start training to see decision boundary", width / 2, height / 2);
      drawDataPoints(ctx, dataPoints, null, width, height);
      return;
    }

    const { grid, bounds, resolution } = boundaryData;
    const cellW = width / resolution;
    const cellH = height / resolution;

    // Draw heatmap via ImageData for performance
    const imageData = ctx.createImageData(width, height);
    const pixels = imageData.data;

    for (let py = 0; py < height; py++) {
      // Map pixel y to grid row
      const row = Math.min(resolution - 1, Math.floor((py / height) * resolution));

      for (let px = 0; px < width; px++) {
        // Map pixel x to grid col
        const col = Math.min(resolution - 1, Math.floor((px / width) * resolution));

        const value = grid[row][col];
        const [r, g, b] = predictionToColor(value);

        const idx = (py * width + px) * 4;
        pixels[idx] = r;
        pixels[idx + 1] = g;
        pixels[idx + 2] = b;
        pixels[idx + 3] = 200; // Semi-transparent for softer look
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Draw grid lines at the 0.5 contour for emphasis
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 0.5;

    for (let row = 0; row < resolution - 1; row++) {
      for (let col = 0; col < resolution - 1; col++) {
        const v = grid[row][col];
        const vRight = grid[row][col + 1];
        const vBelow = grid[row + 1][col];

        // Draw line segment where the 0.5 contour crosses
        if ((v - 0.5) * (vRight - 0.5) < 0) {
          const x = (col + 0.5 + (0.5 - v) / (vRight - v)) * cellW;
          const y = (row + 0.5) * cellH;
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.stroke();
        }
        if ((v - 0.5) * (vBelow - 0.5) < 0) {
          const x = (col + 0.5) * cellW;
          const y = (row + 0.5 + (0.5 - v) / (vBelow - v)) * cellH;
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // Draw data points on top
    drawDataPoints(ctx, dataPoints, bounds, width, height);
  }, [boundaryData, dataPoints, width, height]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
});

// ── Data point rendering ────────────────────────────────────

function drawDataPoints(
  ctx: CanvasRenderingContext2D,
  points: DatasetPoint[],
  bounds: { minX: number; maxX: number; minY: number; maxY: number } | null,
  width: number,
  height: number,
): void {
  if (points.length === 0) return;

  // Compute bounds from points if not provided
  const b = bounds ?? computePointBounds(points);

  const xRange = b.maxX - b.minX || 1;
  const yRange = b.maxY - b.minY || 1;

  for (const point of points) {
    const px = ((point.x - b.minX) / xRange) * width;
    // Flip y axis: maxY is at top (y=0)
    const py = ((b.maxY - point.y) / yRange) * height;

    // Point fill: class 0 = blue, class 1 = red
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = point.label === 0 ? "#3b82f6" : "#ef4444";
    ctx.fill();

    // White border for contrast
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function computePointBounds(points: DatasetPoint[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const padX = (maxX - minX) * 0.1 || 0.5;
  const padY = (maxY - minY) * 0.1 || 0.5;

  return {
    minX: minX - padX,
    maxX: maxX + padX,
    minY: minY - padY,
    maxY: maxY + padY,
  };
}

export { DecisionBoundaryCanvas };
