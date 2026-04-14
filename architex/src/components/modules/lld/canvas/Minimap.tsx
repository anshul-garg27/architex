"use client";

/**
 * Minimap -- Bird's-eye minimap overlay for the LLD Canvas.
 *
 * Shows all UML classes as small colored rectangles with relationship
 * lines, plus the current viewport as a white/blue rectangle outline.
 * Click or drag on the minimap to pan the main canvas.
 *
 * Positioned bottom-right of the canvas container with a toggle button.
 */

import React, { memo, useState, useCallback, useRef, useMemo } from "react";
import { Map as MapIcon } from "lucide-react";
import type { UMLClass, UMLRelationship } from "@/lib/lld";
import {
  STEREOTYPE_BORDER_COLOR,
  classBoxHeight,
  classBoxWidth,
} from "../constants";

// ── Props ───────────────────────────────────────────────────

interface MinimapProps {
  classes: UMLClass[];
  relationships: UMLRelationship[];
  viewportX: number;
  viewportY: number;
  viewportScale: number;
  canvasWidth: number;
  canvasHeight: number;
  onViewportChange: (x: number, y: number) => void;
}

// ── Constants ───────────────────────────────────────────────

const MINIMAP_W = 200;
const MINIMAP_H = 150;
const MINIMAP_PAD = 20;

// ── Component ───────────────────────────────────────────────

export const Minimap = memo(function Minimap({
  classes,
  relationships,
  viewportX,
  viewportY,
  viewportScale,
  canvasWidth,
  canvasHeight,
  onViewportChange,
}: MinimapProps) {
  const [visible, setVisible] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);

  // Compute bounding box encompassing all classes
  const bounds = useMemo(() => {
    if (classes.length === 0) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const cls of classes) {
      const h = classBoxHeight(cls);
      minX = Math.min(minX, cls.x);
      minY = Math.min(minY, cls.y);
      maxX = Math.max(maxX, cls.x + classBoxWidth(cls));
      maxY = Math.max(maxY, cls.y + h);
    }
    return {
      minX: minX - MINIMAP_PAD,
      minY: minY - MINIMAP_PAD,
      maxX: maxX + MINIMAP_PAD,
      maxY: maxY + MINIMAP_PAD,
    };
  }, [classes]);

  const diagramW = bounds.maxX - bounds.minX;
  const diagramH = bounds.maxY - bounds.minY;
  const scale = Math.min(MINIMAP_W / diagramW, MINIMAP_H / diagramH);

  // Viewport rectangle in minimap coordinates
  const vpW = (canvasWidth / viewportScale) * scale;
  const vpH = (canvasHeight / viewportScale) * scale;
  const vpX = (-viewportX / viewportScale - bounds.minX) * scale;
  const vpY = (-viewportY / viewportScale - bounds.minY) * scale;

  // Build lookup for relationships
  const classById = useMemo(() => {
    const map = new Map<string, UMLClass>();
    for (const c of classes) map.set(c.id, c);
    return map;
  }, [classes]);

  // Convert minimap click to canvas coordinates
  const minimapToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;

      // Convert minimap pixel to diagram coordinate
      const diagramX = mx / scale + bounds.minX;
      const diagramY = my / scale + bounds.minY;

      // Center viewport on this point
      const newTx = -(diagramX * viewportScale - canvasWidth / 2);
      const newTy = -(diagramY * viewportScale - canvasHeight / 2);
      onViewportChange(newTx, newTy);
    },
    [scale, bounds, viewportScale, canvasWidth, canvasHeight, onViewportChange],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging.current = true;
      (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
      minimapToCanvas(e.clientX, e.clientY);
    },
    [minimapToCanvas],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDragging.current) return;
      e.preventDefault();
      minimapToCanvas(e.clientX, e.clientY);
    },
    [minimapToCanvas],
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  if (classes.length === 0) return null;

  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-1.5">
      {/* Toggle button */}
      <button
        onClick={() => setVisible((v: boolean) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/30 bg-background/80 text-foreground-muted backdrop-blur-md shadow-lg transition-colors hover:bg-accent hover:text-foreground"
        title={visible ? "Hide minimap" : "Show minimap"}
        aria-label={visible ? "Hide minimap" : "Show minimap"}
      >
        <MapIcon className="h-3.5 w-3.5" />
      </button>

      {/* Minimap panel */}
      {visible && (
        <div
          className="overflow-hidden rounded-lg border border-border/30 bg-gray-900/85 shadow-xl backdrop-blur-md"
          style={{ width: MINIMAP_W, height: MINIMAP_H }}
        >
          <svg
            ref={svgRef}
            width={MINIMAP_W}
            height={MINIMAP_H}
            viewBox={`0 0 ${MINIMAP_W} ${MINIMAP_H}`}
            className="cursor-crosshair"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Relationship lines */}
            {relationships.map((rel) => {
              const src = classById.get(rel.source);
              const tgt = classById.get(rel.target);
              if (!src || !tgt) return null;

              const srcH = classBoxHeight(src);
              const tgtH = classBoxHeight(tgt);

              const x1 = (src.x + classBoxWidth(src) / 2 - bounds.minX) * scale;
              const y1 = (src.y + srcH / 2 - bounds.minY) * scale;
              const x2 = (tgt.x + classBoxWidth(tgt) / 2 - bounds.minX) * scale;
              const y2 = (tgt.y + tgtH / 2 - bounds.minY) * scale;

              const isDashed =
                rel.type === "dependency" || rel.type === "realization";

              return (
                <line
                  key={rel.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(148,163,184,0.4)"
                  strokeWidth={0.8}
                  strokeDasharray={isDashed ? "2 2" : undefined}
                />
              );
            })}

            {/* Class rectangles */}
            {classes.map((cls) => {
              const h = classBoxHeight(cls);
              const rx = (cls.x - bounds.minX) * scale;
              const ry = (cls.y - bounds.minY) * scale;
              const rw = classBoxWidth(cls) * scale;
              const rh = h * scale;
              const color = STEREOTYPE_BORDER_COLOR[cls.stereotype];

              return (
                <rect
                  key={cls.id}
                  x={rx}
                  y={ry}
                  width={Math.max(rw, 2)}
                  height={Math.max(rh, 2)}
                  rx={1}
                  fill={color}
                  fillOpacity={0.35}
                  stroke={color}
                  strokeWidth={0.5}
                  strokeOpacity={0.7}
                />
              );
            })}

            {/* Viewport rectangle */}
            <rect
              x={vpX}
              y={vpY}
              width={Math.max(vpW, 4)}
              height={Math.max(vpH, 4)}
              fill="none"
              stroke="rgba(96,165,250,0.8)"
              strokeWidth={1.5}
              rx={1}
            />
          </svg>
        </div>
      )}
    </div>
  );
});

export default Minimap;
