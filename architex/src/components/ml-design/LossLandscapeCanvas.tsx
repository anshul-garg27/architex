"use client";

import React, { useRef, useEffect, useCallback, useState, memo } from "react";
import { cn } from "@/lib/utils";
import type { LossLandscapeResult } from "@/lib/ml-design/loss-landscape";

// ── Types ────────────────────────────────────────────────────

export interface LossLandscapeCanvasProps {
  /** Loss landscape data to render. */
  landscape: LossLandscapeResult | null;
  /** Current training position as [col, row] in grid coords (0-indexed). */
  currentPosition?: { col: number; row: number } | null;
  /** Canvas width in pixels (default 500). */
  width?: number;
  /** Canvas height in pixels (default 400). */
  height?: number;
  /** CSS class name. */
  className?: string;
}

// ── Isometric projection ─────────────────────────────────────

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Vec2 {
  x: number;
  y: number;
}

/**
 * Project a 3D point to 2D using isometric projection.
 * Applies rotation around the Y axis (yaw) and a fixed tilt.
 */
function projectIsometric(
  p: Vec3,
  rotationY: number,
  tilt: number,
  scale: number,
  offsetX: number,
  offsetY: number,
): Vec2 {
  // Rotate around Y axis
  const cosY = Math.cos(rotationY);
  const sinY = Math.sin(rotationY);
  const rx = p.x * cosY - p.z * sinY;
  const rz = p.x * sinY + p.z * cosY;

  // Apply tilt (rotation around X axis)
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);
  const ry = p.y * cosT - rz * sinT;
  const projZ = p.y * sinT + rz * cosT;

  return {
    x: offsetX + rx * scale,
    y: offsetY - ry * scale, // canvas Y is inverted
  };
}

// ── Color mapping ────────────────────────────────────────────

/**
 * Map a normalised loss value [0, 1] to a color.
 * 0 (low loss) = blue, 0.5 = green, 1 (high loss) = red.
 */
function lossToColor(normalised: number): { r: number; g: number; b: number } {
  const t = Math.max(0, Math.min(1, normalised));

  let r: number, g: number, b: number;

  if (t < 0.25) {
    // Deep blue to light blue
    const s = t / 0.25;
    r = Math.round(20 + 30 * s);
    g = Math.round(60 + 120 * s);
    b = Math.round(180 + 55 * s);
  } else if (t < 0.5) {
    // Light blue to green
    const s = (t - 0.25) / 0.25;
    r = Math.round(50 + 10 * s);
    g = Math.round(180 + 60 * s);
    b = Math.round(235 - 135 * s);
  } else if (t < 0.75) {
    // Green to yellow
    const s = (t - 0.5) / 0.25;
    r = Math.round(60 + 180 * s);
    g = Math.round(240 - 20 * s);
    b = Math.round(100 - 70 * s);
  } else {
    // Yellow to red
    const s = (t - 0.75) / 0.25;
    r = Math.round(240 + 15 * s);
    g = Math.round(220 - 170 * s);
    b = Math.round(30 - 10 * s);
  }

  return { r, g, b };
}

// ── Drawing ──────────────────────────────────────────────────

function drawLandscape(
  ctx: CanvasRenderingContext2D,
  landscape: LossLandscapeResult,
  currentPos: { col: number; row: number } | null,
  width: number,
  height: number,
  rotationY: number,
  zoom: number,
): void {
  const { grid, minLoss, maxLoss, resolution } = landscape;
  const lossRange = maxLoss - minLoss || 1;

  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = "#0f1117";
  ctx.fillRect(0, 0, width, height);

  // Projection parameters
  const baseScale = Math.min(width, height) * 0.28 * zoom;
  const tilt = 0.65; // fixed tilt angle in radians
  const offsetX = width / 2;
  const offsetY = height * 0.6;

  // Map grid indices to 3D coordinates centered at origin
  // X and Z span [-1, 1], Y is the normalised loss height
  const heightScale = 0.5; // vertical exaggeration factor

  // We need to draw back-to-front for proper occlusion.
  // Determine draw order based on rotation.
  const cosR = Math.cos(rotationY);
  const sinR = Math.sin(rotationY);
  const rowStart = sinR + cosR > 0 ? 0 : resolution - 2;
  const rowEnd = sinR + cosR > 0 ? resolution - 1 : -1;
  const rowDir = sinR + cosR > 0 ? 1 : -1;
  const colStart = cosR - sinR > 0 ? 0 : resolution - 2;
  const colEnd = cosR - sinR > 0 ? resolution - 1 : -1;
  const colDir = cosR - sinR > 0 ? 1 : -1;

  // Helper to get 3D point from grid coordinates
  const getPoint = (r: number, c: number): Vec3 => {
    const x = -1 + (2 * c) / (resolution - 1);
    const z = -1 + (2 * r) / (resolution - 1);
    const normalised = (grid[r][c] - minLoss) / lossRange;
    const y = normalised * heightScale;
    return { x, y, z };
  };

  // Draw grid lines first (subtle)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 0.5;

  // Draw along rows
  for (let r = 0; r < resolution; r += Math.max(1, Math.floor(resolution / 20))) {
    ctx.beginPath();
    for (let c = 0; c < resolution; c++) {
      const p3d = getPoint(r, c);
      const p2d = projectIsometric(p3d, rotationY, tilt, baseScale, offsetX, offsetY);
      if (c === 0) ctx.moveTo(p2d.x, p2d.y);
      else ctx.lineTo(p2d.x, p2d.y);
    }
    ctx.stroke();
  }

  // Draw along columns
  for (let c = 0; c < resolution; c += Math.max(1, Math.floor(resolution / 20))) {
    ctx.beginPath();
    for (let r = 0; r < resolution; r++) {
      const p3d = getPoint(r, c);
      const p2d = projectIsometric(p3d, rotationY, tilt, baseScale, offsetX, offsetY);
      if (r === 0) ctx.moveTo(p2d.x, p2d.y);
      else ctx.lineTo(p2d.x, p2d.y);
    }
    ctx.stroke();
  }

  // Draw filled quads (surface)
  for (let r = rowStart; r !== rowEnd; r += rowDir) {
    for (let c = colStart; c !== colEnd; c += colDir) {
      // Four corners of the quad
      const p00 = getPoint(r, c);
      const p01 = getPoint(r, c + 1);
      const p10 = getPoint(r + 1, c);
      const p11 = getPoint(r + 1, c + 1);

      // Average normalised loss for color
      const avgNorm =
        ((grid[r][c] + grid[r][c + 1] + grid[r + 1][c] + grid[r + 1][c + 1]) /
          4 -
          minLoss) /
        lossRange;

      const color = lossToColor(avgNorm);

      // Project all four points
      const s00 = projectIsometric(p00, rotationY, tilt, baseScale, offsetX, offsetY);
      const s01 = projectIsometric(p01, rotationY, tilt, baseScale, offsetX, offsetY);
      const s10 = projectIsometric(p10, rotationY, tilt, baseScale, offsetX, offsetY);
      const s11 = projectIsometric(p11, rotationY, tilt, baseScale, offsetX, offsetY);

      // Fill quad
      ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},0.85)`;
      ctx.beginPath();
      ctx.moveTo(s00.x, s00.y);
      ctx.lineTo(s01.x, s01.y);
      ctx.lineTo(s11.x, s11.y);
      ctx.lineTo(s10.x, s10.y);
      ctx.closePath();
      ctx.fill();

      // Subtle edge lines for depth
      ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},0.3)`;
      ctx.lineWidth = 0.3;
      ctx.stroke();
    }
  }

  // Draw current position marker
  if (
    currentPos &&
    currentPos.row >= 0 &&
    currentPos.row < resolution &&
    currentPos.col >= 0 &&
    currentPos.col < resolution
  ) {
    const markerP3d = getPoint(currentPos.row, currentPos.col);
    // Elevate the marker slightly above the surface
    markerP3d.y += 0.03;
    const markerP2d = projectIsometric(
      markerP3d,
      rotationY,
      tilt,
      baseScale,
      offsetX,
      offsetY,
    );

    // Glow
    const gradient = ctx.createRadialGradient(
      markerP2d.x,
      markerP2d.y,
      0,
      markerP2d.x,
      markerP2d.y,
      12,
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(0.5, "rgba(96, 165, 250, 0.4)");
    gradient.addColorStop(1, "rgba(96, 165, 250, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(markerP2d.x, markerP2d.y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Dot
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(markerP2d.x, markerP2d.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(markerP2d.x, markerP2d.y, 4, 0, Math.PI * 2);
    ctx.stroke();

    // Vertical line down to the base plane
    const baseP3d: Vec3 = { x: markerP3d.x, y: 0, z: markerP3d.z };
    const baseP2d = projectIsometric(
      baseP3d,
      rotationY,
      tilt,
      baseScale,
      offsetX,
      offsetY,
    );
    ctx.strokeStyle = "rgba(96, 165, 250, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(markerP2d.x, markerP2d.y);
    ctx.lineTo(baseP2d.x, baseP2d.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Color bar legend
  const barX = width - 30;
  const barY = 20;
  const barH = height - 60;
  const barW = 12;

  for (let i = 0; i < barH; i++) {
    const t = i / barH; // 0 = top (high loss) to 1 = bottom (low loss)
    const color = lossToColor(1 - t);
    ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
    ctx.fillRect(barX, barY + i, barW, 1);
  }

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  // Labels
  ctx.fillStyle = "#9ca3af";
  ctx.font = "9px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(maxLoss.toFixed(2), barX - 4, barY + 8);
  ctx.fillText(minLoss.toFixed(2), barX - 4, barY + barH);
  ctx.fillText("Loss", barX + barW / 2 + 3, barY - 6);
}

// ── Component ────────────────────────────────────────────────

const LossLandscapeCanvas = memo(function LossLandscapeCanvas({
  landscape,
  currentPosition = null,
  width = 500,
  height = 400,
  className,
}: LossLandscapeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotationY, setRotationY] = useState(-0.6); // Initial rotation
  const [zoom, setZoom] = useState(1.0);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!landscape) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#0f1117";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#888";
      ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "Loss landscape will appear here",
        width / 2,
        height / 2,
      );
      return;
    }

    drawLandscape(
      ctx,
      landscape,
      currentPosition ?? null,
      width,
      height,
      rotationY,
      zoom,
    );
  }, [landscape, currentPosition, width, height, rotationY, zoom]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse drag to rotate
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      isDragging.current = true;
      lastMouseX.current = e.clientX;
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging.current) return;

      const dx = e.clientX - lastMouseX.current;
      lastMouseX.current = e.clientX;

      setRotationY((prev) => prev + dx * 0.008);
    },
    [],
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Scroll to zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      setZoom((prev) => Math.max(0.3, Math.min(3.0, prev - e.deltaY * 0.001)));
    },
    [],
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        className="cursor-grab rounded-lg border border-border active:cursor-grabbing"
        style={{ width: "100%", height: "auto" }}
      />
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Drag to rotate | Scroll to zoom</span>
        {landscape && (
          <span>
            Loss range: [{landscape.minLoss.toFixed(3)}, {landscape.maxLoss.toFixed(3)}]
            {" | "}
            {landscape.resolution}x{landscape.resolution} grid
          </span>
        )}
      </div>
    </div>
  );
});

export { LossLandscapeCanvas };
