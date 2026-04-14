"use client";

/**
 * LLD Canvas — UML class diagram canvas with zoom/pan, drag, connection handles.
 * Split from LLDModule.tsx (LLD-037).
 */

import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Layers, Sparkles, Loader2, LayoutGrid } from "lucide-react";
import { AIReviewPanel } from "./AIReviewPanel";
import { Minimap } from "./Minimap";
import { CanvasEmptyState } from "@/components/shared/lld-empty-states";
import { cn } from "@/lib/utils";
import type { UMLClass, UMLRelationship, UMLRelationshipType, UMLMethodParam } from "@/lib/lld";
import { formatMethodParams } from "@/lib/lld";
import { routeEdgeAStar } from "@/lib/lld/astar-router";
import { motion } from "motion/react";
import {
  CLASS_HEADER_HEIGHT,
  ROW_HEIGHT,
  SECTION_PAD,
  STEREOTYPE_BORDER_COLOR,
  STEREOTYPE_LABEL,
  VISIBILITY_ICON,
  VISIBILITY_TOOLTIP,
  RELATIONSHIP_TOOLTIPS,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_STEP,
  STEREOTYPE_LABEL_HEIGHT,
  CANVAS_VIEWBOX_PAD,
  CANVAS_GRID_SIZE,
  CONNECTION_HANDLE_R,
  CLASS_BOX_SHADOW_OFFSET,
  classBoxHeight,
  classBoxWidth,
  classCenter,
  borderPoint,
} from "../constants";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

// ── SVG Zoom & Pan Hook ──────────────────────────────────

interface SVGZoomPanState {
  scale: number;
  translateX: number;
  translateY: number;
}

export function useSVGZoomPan(svgRef: React.RefObject<SVGSVGElement | null>) {
  const [zoom, setZoom] = useState<SVGZoomPanState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      setZoom((prev) => {
        const direction = e.deltaY < 0 ? 1 : -1;
        const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev.scale * (1 + direction * ZOOM_STEP)));
        const scaleRatio = newScale / prev.scale;
        const newTx = cx - scaleRatio * (cx - prev.translateX);
        const newTy = cy - scaleRatio * (cy - prev.translateY);
        return { scale: newScale, translateX: newTx, translateY: newTy };
      });
    };
    svg.addEventListener("wheel", handler, { passive: false });
    return () => svg.removeEventListener("wheel", handler);
  }, [svgRef]);

  const handlePanStart = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;
      if (e.target !== e.currentTarget && (e.target as SVGElement).tagName !== "rect") return;
      isPanning.current = true;
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        tx: zoom.translateX,
        ty: zoom.translateY,
      };
      (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    },
    [zoom.translateX, zoom.translateY],
  );

  const handlePanMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isPanning.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setZoom((prev) => ({
        ...prev,
        translateX: panStart.current.tx + dx,
        translateY: panStart.current.ty + dy,
      }));
    },
    [],
  );

  const handlePanEnd = useCallback(() => {
    isPanning.current = false;
  }, []);

  const zoomIn = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setZoom((prev) => {
      const newScale = Math.min(ZOOM_MAX, prev.scale * (1 + ZOOM_STEP));
      const ratio = newScale / prev.scale;
      return { scale: newScale, translateX: cx - ratio * (cx - prev.translateX), translateY: cy - ratio * (cy - prev.translateY) };
    });
  }, [svgRef]);

  const zoomOut = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setZoom((prev) => {
      const newScale = Math.max(ZOOM_MIN, prev.scale * (1 - ZOOM_STEP));
      const ratio = newScale / prev.scale;
      return { scale: newScale, translateX: cx - ratio * (cx - prev.translateX), translateY: cy - ratio * (cy - prev.translateY) };
    });
  }, [svgRef]);

  const zoomReset = useCallback(() => {
    setZoom({ scale: 1, translateX: 0, translateY: 0 });
  }, []);

  /**
   * Fit all content into the viewport by computing the proper scale
   * and translate to center the content bounds within the container.
   * With a fixed viewBox (0 0 2000 2000), the CSS transform handles
   * ALL fitting — no dual-system coordination needed.
   */
  const zoomFit = useCallback((bounds?: { x: number; y: number; w: number; h: number }) => {
    const svg = svgRef.current;
    if (!svg || !bounds || bounds.w <= 0 || bounds.h <= 0) {
      setZoom({ scale: 1, translateX: 0, translateY: 0 });
      return;
    }

    const rect = svg.getBoundingClientRect();
    // The SVG viewBox is fixed 2000x2000, so 1 SVG unit = rect.width/2000 screen pixels
    const svgToScreen = rect.width / 2000;

    const PAD = 60;
    const availW = rect.width - PAD * 2;
    const availH = rect.height - PAD * 2;
    if (availW <= 0 || availH <= 0) return;

    // Content size in screen pixels at scale=1
    const contentScreenW = bounds.w * svgToScreen;
    const contentScreenH = bounds.h * svgToScreen;

    // Scale to fit content within available space
    const scaleX = availW / contentScreenW;
    const scaleY = availH / contentScreenH;
    const fitScale = Math.max(ZOOM_MIN, Math.min(Math.min(scaleX, scaleY), ZOOM_MAX));

    // Center the content
    const contentCenterX = (bounds.x + bounds.w / 2) * svgToScreen;
    const contentCenterY = (bounds.y + bounds.h / 2) * svgToScreen;

    setZoom({
      scale: fitScale,
      translateX: rect.width / 2 - contentCenterX * fitScale,
      translateY: rect.height / 2 - contentCenterY * fitScale,
    });
  }, [svgRef]);

  const setViewportPosition = useCallback(
    (svgX: number, svgY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      setZoom((prev) => ({
        ...prev,
        translateX: rect.width / 2 - svgX * prev.scale,
        translateY: rect.height / 2 - svgY * prev.scale,
      }));
    },
    [svgRef],
  );

  const svgTransform = `translate(${zoom.translateX},${zoom.translateY}) scale(${zoom.scale})`;
  const zoomPercent = Math.round(zoom.scale * 100);

  return {
    zoom,
    svgTransform,
    zoomPercent,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    zoomIn,
    zoomOut,
    zoomReset,
    zoomFit,
    setViewportPosition,
  };
}

// ── Zoom Toolbar ─────────────────────────────────────────

export const ZoomToolbar = memo(function ZoomToolbar({
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoomReset,
}: {
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onZoomReset: () => void;
}) {
  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-xl border border-border/30 backdrop-blur-md bg-background/90 px-2 py-1.5 shadow-xl">
      <button
        onClick={onZoomOut}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border/50 text-xs font-bold text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
        title="Zoom out"
        aria-label="Zoom out"
      >
        -
      </button>
      <span className="min-w-[3rem] text-center text-[10px] font-medium text-foreground-subtle">
        {zoomPercent}%
      </span>
      <button
        onClick={onZoomIn}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border/50 text-xs font-bold text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
        title="Zoom in"
        aria-label="Zoom in"
      >
        +
      </button>
      <div className="mx-0.5 h-4 w-px bg-border/30" />
      <button
        onClick={onZoomFit}
        className="rounded-full bg-background/80 backdrop-blur border border-border/50 px-1.5 py-0.5 text-[10px] font-medium text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
        title="Fit to view"
        aria-label="Fit to view"
      >
        Fit
      </button>
      <button
        onClick={onZoomReset}
        className="rounded-full bg-background/80 backdrop-blur border border-border/50 px-1.5 py-0.5 text-[10px] font-medium text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
        title="Reset to 100%"
        aria-label="Reset to 100%"
      >
        100%
      </button>
    </div>
  );
});

// ── SVG: Relationship Markers ──────────────────────────────

/** Single monochrome stroke for all UML relationships (per UML 2.5 standard). */
const REL_STROKE = "var(--lld-rel-stroke)";
/** Background fill for hollow markers (triangle/diamond). */
const REL_FILL_BG = "var(--lld-canvas-bg-deep, #0f0f1a)";

export const RelationshipDefs = memo(function RelationshipDefs() {
  return (
    <defs>
      {/* ── Inheritance: solid line + HOLLOW triangle (16×16) ── */}
      <marker id="arrow-inheritance" viewBox="0 0 16 16" refX="16" refY="8"
        markerWidth="14" markerHeight="14" orient="auto-start-reverse">
        <path d="M 0 0 L 16 8 L 0 16 Z" fill={REL_FILL_BG} stroke={REL_STROKE} strokeWidth="2" />
      </marker>

      {/* ── Realization: dashed line + HOLLOW triangle (same as inheritance) ── */}
      <marker id="arrow-realization" viewBox="0 0 16 16" refX="16" refY="8"
        markerWidth="14" markerHeight="14" orient="auto-start-reverse">
        <path d="M 0 0 L 16 8 L 0 16 Z" fill={REL_FILL_BG} stroke={REL_STROKE} strokeWidth="2" />
      </marker>

      {/* ── Composition: solid line + FILLED diamond (18×12) ── */}
      <marker id="arrow-composition" viewBox="0 0 18 12" refX="0" refY="6"
        markerWidth="16" markerHeight="11" orient="auto-start-reverse">
        <path d="M 0 6 L 9 0 L 18 6 L 9 12 Z" fill={REL_STROKE} stroke={REL_STROKE} strokeWidth="1" />
      </marker>

      {/* ── Aggregation: solid line + HOLLOW diamond (18×12) ── */}
      <marker id="arrow-aggregation" viewBox="0 0 18 12" refX="0" refY="6"
        markerWidth="16" markerHeight="11" orient="auto-start-reverse">
        <path d="M 0 6 L 9 0 L 18 6 L 9 12 Z" fill={REL_FILL_BG} stroke={REL_STROKE} strokeWidth="2" />
      </marker>

      {/* ── Association: solid line + open V arrow (12×12) ── */}
      <marker id="arrow-association" viewBox="0 0 12 12" refX="12" refY="6"
        markerWidth="11" markerHeight="11" orient="auto-start-reverse">
        <path d="M 0 1 L 11 6 L 0 11" fill="none" stroke={REL_STROKE} strokeWidth="2" strokeLinecap="round" />
      </marker>

      {/* ── Dependency: dashed line + open V arrow (same shape as association) ── */}
      <marker id="arrow-dependency" viewBox="0 0 12 12" refX="12" refY="6"
        markerWidth="11" markerHeight="11" orient="auto-start-reverse">
        <path d="M 0 1 L 11 6 L 0 11" fill="none" stroke={REL_STROKE} strokeWidth="2" strokeLinecap="round" />
      </marker>
    </defs>
  );
});

// ── SVG: UML Class Box ─────────────────────────────────────

interface UMLClassBoxProps {
  cls: UMLClass;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDrag: (id: string, dx: number, dy: number) => void;
  editingNameId: string | null;
  editingNameValue: string;
  onStartEditName: (id: string) => void;
  onChangeEditName: (value: string) => void;
  onCommitEditName: () => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onConnectionDragStart: (classId: string, side: "top" | "bottom" | "left" | "right", e: React.PointerEvent) => void;
  index: number;
  reducedMotion: boolean;
  /** Focus mode: true when another class is hovered and this one is NOT connected to it. */
  dimmed?: boolean;
}

const UMLClassBox = memo(function UMLClassBox({
  cls,
  isSelected,
  onSelect,
  onDrag,
  editingNameId,
  editingNameValue,
  onStartEditName,
  onChangeEditName,
  onCommitEditName,
  isHovered,
  onHover,
  onConnectionDragStart,
  index,
  reducedMotion,
  dimmed = false,
}: UMLClassBoxProps) {
  const borderColor = STEREOTYPE_BORDER_COLOR[cls.stereotype];
  const stereo = STEREOTYPE_LABEL[cls.stereotype];
  const h = classBoxHeight(cls);
  const w = classBoxWidth(cls);
  const hasStereo = stereo.length > 0;
  const isEditing = editingNameId === cls.id;
  const foreignObjectRef = useRef<SVGForeignObjectElement>(null);

  useEffect(() => {
    if (isEditing && foreignObjectRef.current) {
      const input = foreignObjectRef.current.querySelector("input");
      if (input) {
        input.focus();
        input.select();
      }
    }
  }, [isEditing]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      e.stopPropagation();
      onSelect(cls.id);
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      let lastX = e.clientX;
      let lastY = e.clientY;
      let moved = false;

      const handleMove = (ev: PointerEvent) => {
        const dx = ev.clientX - lastX;
        const dy = ev.clientY - lastY;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) moved = true;
        lastX = ev.clientX;
        lastY = ev.clientY;
        onDrag(cls.id, dx, dy);
      };

      const handleUp = () => {
        el.removeEventListener("pointermove", handleMove);
        el.removeEventListener("pointerup", handleUp);
      };

      el.addEventListener("pointermove", handleMove);
      el.addEventListener("pointerup", handleUp);
    },
    [cls.id, onSelect, onDrag],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onStartEditName(cls.id);
    },
    [cls.id, onStartEditName],
  );

  let yOff = cls.y;

  const headerY = yOff;
  yOff += CLASS_HEADER_HEIGHT;

  let stereoY = yOff;
  if (hasStereo) {
    stereoY = yOff;
    yOff += STEREOTYPE_LABEL_HEIGHT;
  }

  const attrStartY = yOff + SECTION_PAD;
  const attrSectionH = cls.attributes.length * ROW_HEIGHT + SECTION_PAD;
  yOff += attrSectionH;

  const dividerY = yOff;

  const methStartY = yOff + SECTION_PAD;

  const handles: Array<{ side: "top" | "bottom" | "left" | "right"; cx: number; cy: number }> = [
    { side: "top", cx: cls.x + w / 2, cy: cls.y },
    { side: "bottom", cx: cls.x + w / 2, cy: cls.y + h },
    { side: "left", cx: cls.x, cy: cls.y + h / 2 },
    { side: "right", cx: cls.x + w, cy: cls.y + h / 2 },
  ];

  return (
    <motion.g
      tabIndex={0}
      role="button"
      aria-label={`${cls.stereotype} ${cls.name}: ${cls.attributes.length} attributes, ${cls.methods.length} methods`}
      onPointerDown={handlePointerDown}
      onPointerEnter={() => onHover(cls.id)}
      onPointerLeave={() => onHover(null)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(cls.id);
        }
      }}
      style={{
        cursor: "grab",
        outline: "none",
        transition: "filter 0.15s ease, opacity 0.15s ease",
        opacity: dimmed ? 0.35 : 1,
      }}
      filter={isSelected ? "url(#glow)" : isHovered ? "drop-shadow(0 4px 12px rgba(0,0,0,0.35))" : undefined}
      {...(reducedMotion
        ? {}
        : {
            initial: { opacity: 0, scale: 0.85 },
            animate: { opacity: 1, scale: 1 },
            transition: {
              delay: index * 0.08,
              type: "spring" as const,
              damping: 20,
              stiffness: 300,
            },
          })}
    >
      {/* Stereotype glow aura — colored halo behind the box */}
      {(isHovered || isSelected) && (
        <rect
          x={cls.x - 8}
          y={cls.y - 8}
          width={w + 16}
          height={h + 16}
          rx={12}
          fill={borderColor}
          opacity={isSelected ? 0.15 : 0.08}
          style={{ filter: "blur(12px)", transition: "opacity 0.3s ease" }}
        />
      )}
      {/* Shadow */}
      <rect
        x={cls.x + CLASS_BOX_SHADOW_OFFSET}
        y={cls.y + CLASS_BOX_SHADOW_OFFSET}
        width={w}
        height={h}
        rx={4}
        fill="rgba(0,0,0,0.25)"
      />
      {/* Background */}
      <rect
        x={cls.x}
        y={cls.y}
        width={w}
        height={h}
        rx={4}
        fill="var(--lld-canvas-bg)"
        stroke={isSelected ? "var(--lld-canvas-selected)" : borderColor}
        strokeWidth={isSelected ? 2.5 : 1.5}
      />
      {/* Header background — subtle gradient tint matching stereotype */}
      <rect
        x={cls.x}
        y={cls.y}
        width={w}
        height={CLASS_HEADER_HEIGHT + (hasStereo ? STEREOTYPE_LABEL_HEIGHT : 0)}
        rx={4}
        fill={borderColor}
        opacity={isHovered ? 0.18 : 0.1}
        style={{ transition: "opacity 0.2s ease" }}
      />
      {/* Bottom corners overlap fix */}
      <rect
        x={cls.x}
        y={cls.y + CLASS_HEADER_HEIGHT + (hasStereo ? STEREOTYPE_LABEL_HEIGHT / 2 : 0)}
        width={w}
        height={STEREOTYPE_LABEL_HEIGHT / 2}
        fill={borderColor}
        opacity={0.094}
      />

      {/* Stereotype label */}
      {hasStereo && (
        <text
          x={cls.x + w / 2}
          y={headerY + 14}
          textAnchor="middle"
          fill={borderColor}
          fontSize="11"
          fontFamily="monospace"
        >
          {`\u00AB${stereo}\u00BB`}
        </text>
      )}

      {/* Class name — inline edit or static text */}
      {isEditing ? (
        <foreignObject
          ref={foreignObjectRef}
          x={cls.x + 10}
          y={hasStereo ? stereoY - 2 : headerY + 6}
          width={w - 20}
          height={22}
        >
          <input
            type="text"
            value={editingNameValue}
            onChange={(e) => onChangeEditName(e.target.value)}
            onBlur={onCommitEditName}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCommitEditName();
              if (e.key === "Escape") onCommitEditName();
            }}
            style={{
              width: "100%",
              height: "100%",
              background: "var(--lld-canvas-bg-deep)",
              color: "var(--lld-canvas-text)",
              border: "1px solid var(--lld-canvas-selected)",
              borderRadius: 3,
              fontSize: 13,
              fontWeight: 700,
              textAlign: "center",
              outline: "none",
              padding: "0 4px",
              fontStyle: cls.stereotype === "abstract" ? "italic" : "normal",
            }}
          />
        </foreignObject>
      ) : (
        <text
          x={cls.x + w / 2}
          y={hasStereo ? stereoY + 10 : headerY + 22}
          textAnchor="middle"
          fill="var(--lld-canvas-text)"
          fontSize="13"
          fontWeight="700"
          fontStyle={cls.stereotype === "abstract" ? "italic" : "normal"}
          onDoubleClick={handleDoubleClick}
          style={{ cursor: "text" }}
        >
          {cls.name}
        </text>
      )}

      {/* Divider: header / attributes */}
      <line
        x1={cls.x}
        y1={attrStartY - SECTION_PAD}
        x2={cls.x + w}
        y2={attrStartY - SECTION_PAD}
        stroke={borderColor}
        strokeWidth="0.5"
        opacity={0.5}
      />

      {/* Attributes */}
      {cls.attributes.map((attr, i) => (
        <text
          key={`attr-${i}`}
          x={cls.x + 10}
          y={attrStartY + i * ROW_HEIGHT + 13}
          fill="var(--lld-canvas-text-muted)"
          fontSize="11"
          fontFamily="monospace"
        >
          <tspan fill="var(--lld-canvas-text-subtle)">
            <title>{VISIBILITY_TOOLTIP[attr.visibility] ?? attr.visibility}</title>
            {VISIBILITY_ICON[attr.visibility]}{" "}
          </tspan>
          {attr.name}
          <tspan fill="var(--lld-canvas-text-subtle)">: {attr.type}</tspan>
        </text>
      ))}

      {/* Divider: attributes / methods */}
      <line
        x1={cls.x}
        y1={dividerY}
        x2={cls.x + w}
        y2={dividerY}
        stroke={borderColor}
        strokeWidth="0.5"
        opacity={0.5}
      />

      {/* Methods */}
      {cls.methods.map((meth, i) => (
        <text
          key={`meth-${i}`}
          x={cls.x + 10}
          y={methStartY + i * ROW_HEIGHT + 13}
          fill={meth.isAbstract ? "var(--lld-canvas-abstract)" : "var(--lld-canvas-text-muted)"}
          fontSize="11"
          fontFamily="monospace"
          fontStyle={meth.isAbstract ? "italic" : "normal"}
        >
          <tspan fill="var(--lld-canvas-text-subtle)">
            <title>{VISIBILITY_TOOLTIP[meth.visibility] ?? meth.visibility}</title>
            {VISIBILITY_ICON[meth.visibility]}{" "}
          </tspan>
          {meth.name}({formatMethodParams(meth.params)})
          <tspan fill="var(--lld-canvas-text-subtle)">: {meth.returnType}</tspan>
        </text>
      ))}

      {/* Connection handles — shown on hover or selection */}
      {(isHovered || isSelected) &&
        handles.map((handle) => (
          <circle
            key={handle.side}
            cx={handle.cx}
            cy={handle.cy}
            r={CONNECTION_HANDLE_R}
            fill="var(--lld-canvas-selected)"
            stroke="var(--lld-canvas-bg)"
            strokeWidth={2}
            filter="url(#glow)"
            style={{ cursor: "crosshair" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onConnectionDragStart(cls.id, handle.side, e);
            }}
          />
        ))}
    </motion.g>
  );
});

// ── SVG: UML Relationship Edge ─────────────────────────────

/** Radius for rounded corners on orthogonal bends — larger = softer. */
const BEND_R = 12;

type Pt = { x: number; y: number };

/**
 * Determine which side of a box a point exits/enters from.
 * Returns "top" | "bottom" | "left" | "right".
 */
function exitSide(cls: UMLClass, pt: Pt): "top" | "bottom" | "left" | "right" {
  const w = classBoxWidth(cls);
  const h = classBoxHeight(cls);
  const cx = cls.x + w / 2;
  const cy = cls.y + h / 2;
  const dx = pt.x - cx;
  const dy = pt.y - cy;
  // Which edge is closest to the border point?
  const distTop = Math.abs(pt.y - cls.y);
  const distBot = Math.abs(pt.y - (cls.y + h));
  const distLeft = Math.abs(pt.x - cls.x);
  const distRight = Math.abs(pt.x - (cls.x + w));
  const min = Math.min(distTop, distBot, distLeft, distRight);
  if (min === distTop) return "top";
  if (min === distBot) return "bottom";
  if (min === distLeft) return "left";
  return "right";
}

/**
 * Compute the orthogonal anchor point: the center of the given side of the box.
 */
function sideAnchor(cls: UMLClass, side: "top" | "bottom" | "left" | "right"): Pt {
  const w = classBoxWidth(cls);
  const h = classBoxHeight(cls);
  const cx = cls.x + w / 2;
  switch (side) {
    case "top":    return { x: cx, y: cls.y };
    case "bottom": return { x: cx, y: cls.y + h };
    case "left":   return { x: cls.x, y: cls.y + h / 2 };
    case "right":  return { x: cls.x + w, y: cls.y + h / 2 };
  }
}

/**
 * Build an SVG path `d` from orthogonal waypoints with rounded corners.
 */
function buildOrthoPathD(pts: Pt[]): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  }

  let d = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];

    // Distance to previous and next points
    const dPrev = Math.abs(curr.x - prev.x) + Math.abs(curr.y - prev.y);
    const dNext = Math.abs(next.x - curr.x) + Math.abs(next.y - curr.y);
    const r = Math.min(BEND_R, dPrev / 2, dNext / 2);

    if (r < 1) {
      // Too tight for a curve — just go straight
      d += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    // Point on the incoming segment, `r` before the corner
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const len1 = Math.abs(dx1) + Math.abs(dy1);
    const ax = curr.x - (dx1 / len1) * r;
    const ay = curr.y - (dy1 / len1) * r;

    // Point on the outgoing segment, `r` after the corner
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const len2 = Math.abs(dx2) + Math.abs(dy2);
    const bx = curr.x + (dx2 / len2) * r;
    const by = curr.y + (dy2 / len2) * r;

    // Line to the arc start, then quadratic bezier through the corner
    d += ` L ${ax} ${ay} Q ${curr.x} ${curr.y} ${bx} ${by}`;
  }

  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

interface UMLEdgeProps {
  rel: UMLRelationship;
  classById: Map<string, UMLClass>;
  /** All classes on the canvas — used to compute A* routing obstacles. */
  allClasses: UMLClass[];
  edgeDelay: number;
  reducedMotion: boolean;
  /** Dagre-computed route points for this edge (if available). */
  routePoints?: Array<{ x: number; y: number }>;
  /** Pixel offset to spread this edge's exit port from center (src side). */
  srcPortOffset?: number;
  /** Pixel offset to spread this edge's enter port from center (tgt side). */
  tgtPortOffset?: number;
  /** Whether this edge's source or target class is being hovered. */
  highlighted?: boolean;
  /** Focus mode: edge is not connected to hovered class, should dim. */
  dimmed?: boolean;
  /** How many edges share the same source port group (for visual bundling). */
  siblingCount?: number;
}

const UMLEdge = memo(function UMLEdge({ rel, classById, allClasses, edgeDelay, reducedMotion, routePoints, srcPortOffset = 0, tgtPortOffset = 0, highlighted = false, dimmed = false, siblingCount = 1 }: UMLEdgeProps) {
  const srcCls = classById.get(rel.source);
  const tgtCls = classById.get(rel.target);
  if (!srcCls || !tgtCls) return null;

  const srcCenter = classCenter(srcCls);
  const tgtCenter = classCenter(tgtCls);

  // Compute the best exit/enter sides for orthogonal routing
  const rawSrc = borderPoint(srcCls, tgtCenter.cx, tgtCenter.cy);
  const rawTgt = borderPoint(tgtCls, srcCenter.cx, srcCenter.cy);
  const srcSide = exitSide(srcCls, rawSrc);
  const tgtSide = exitSide(tgtCls, rawTgt);

  // Use side-center anchors + port offset for spread
  const srcBase = sideAnchor(srcCls, srcSide);
  const tgtBase = sideAnchor(tgtCls, tgtSide);
  // Apply offset along the side (perpendicular to the exit direction)
  const isVertSrc = srcSide === "top" || srcSide === "bottom";
  const isVertTgt = tgtSide === "top" || tgtSide === "bottom";
  const src = isVertSrc
    ? { x: srcBase.x + srcPortOffset, y: srcBase.y }
    : { x: srcBase.x, y: srcBase.y + srcPortOffset };
  const tgt = isVertTgt
    ? { x: tgtBase.x + tgtPortOffset, y: tgtBase.y }
    : { x: tgtBase.x, y: tgtBase.y + tgtPortOffset };

  const isDashed =
    rel.type === "dependency" || rel.type === "realization";

  const markerMap: Record<UMLRelationshipType, string> = {
    inheritance: "url(#arrow-inheritance)",
    realization: "url(#arrow-realization)",
    association: "url(#arrow-association)",
    dependency: "url(#arrow-dependency)",
    composition: "",
    aggregation: "",
  };

  const hasDiamond =
    rel.type === "composition" || rel.type === "aggregation";

  // Build obstacle list from all classes except source and target
  const obstacles = allClasses
    .filter((c) => c.id !== rel.source && c.id !== rel.target)
    .map((c) => ({ x: c.x, y: c.y, w: classBoxWidth(c), h: classBoxHeight(c) }));

  // A*-routed orthogonal path that avoids obstacles, with rounded corners
  const waypoints = routeEdgeAStar(src, srcSide, tgt, tgtSide, obstacles, tgtPortOffset);
  const pathD = buildOrthoPathD(waypoints);

  // Label at the midpoint of the middle segment
  const midIdx = Math.floor(waypoints.length / 2);
  const midA = waypoints[Math.max(0, midIdx - 1)];
  const midB = waypoints[midIdx];
  const labelPos = { x: (midA.x + midB.x) / 2, y: (midA.y + midB.y) / 2 - 10 };

  // Cardinality labels — offset perpendicular to the exit side of the orthogonal line.
  // For vertical exits (top/bottom), offset horizontally. For horizontal exits, offset vertically.
  // Position cardinality labels well away from the box edge on the approach line.
  // For vertical sides (top/bottom), push 45px outward along the line + 18px sideways.
  // For horizontal sides (left/right), push 45px outward + 12px up.
  const cardPos = (anchor: Pt, side: string): Pt => {
    const isVert = side === "top" || side === "bottom";
    const outward = (side === "bottom" || side === "right") ? 1 : -1;
    return isVert
      ? { x: anchor.x + 20, y: anchor.y + outward * 45 }
      : { x: anchor.x + outward * 45, y: anchor.y - 12 };
  };
  const srcCardPos = cardPos(src, srcSide);
  const tgtCardPos = cardPos(tgt, tgtSide);

  // Edge draw animation: measure path length, animate stroke-dashoffset
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [pathD]);

  const drawStyle = (!reducedMotion && pathLength > 0) ? {
    strokeDasharray: isDashed ? "10 6" : pathLength,
    strokeDashoffset: isDashed ? undefined : pathLength,
    animation: isDashed ? undefined : `lld-edge-draw 0.7s cubic-bezier(0.4,0,0.2,1) ${edgeDelay}s forwards`,
  } : undefined;

  return (
    <motion.g
      style={{ opacity: dimmed ? 0.2 : undefined, transition: "opacity 0.15s ease" }}
      {...(reducedMotion
        ? {}
        : {
            initial: { opacity: 0 },
            animate: { opacity: dimmed ? 0.2 : 1 },
            transition: { delay: edgeDelay, duration: 0.2 },
          })}
    >
      {/* Subtle shadow path for depth — reduced when edges are bundled */}
      <path
        d={pathD}
        fill="none"
        stroke={siblingCount > 1 ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.12)"}
        strokeWidth={siblingCount > 1 ? 2 : 3}
        strokeDasharray={isDashed ? "10 6" : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: siblingCount > 1 ? "blur(1px)" : "blur(2px)" }}
      />
      {/* Main edge path — with draw animation on load */}
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke={highlighted ? "var(--lld-rel-highlight)" : REL_STROKE}
        strokeWidth={highlighted ? 2 : 1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={markerMap[rel.type] || undefined}
        markerStart={
          hasDiamond
            ? `url(#arrow-${rel.type})`
            : undefined
        }
        style={{
          ...drawStyle,
          ...(highlighted ? { filter: "drop-shadow(0 0 6px var(--lld-rel-highlight))" } : {}),
        }}
        className={cn(
          "transition-all duration-300",
          highlighted && "lld-edge-highlight",
        )}
      />
      {/* Animated flowing dot — shows relationship direction */}
      {!reducedMotion && pathD && (
        <circle
          r="2.5"
          fill={highlighted ? "var(--lld-rel-highlight)" : "var(--lld-rel-stroke)"}
          opacity={highlighted ? 0.9 : 0.5}
          className="lld-dot-flow"
          style={{
            offsetPath: `path('${pathD}')`,
            "--dot-duration": "2.5s",
            "--dot-delay": `${edgeDelay + 0.8}s`,
          } as React.CSSProperties}
        />
      )}
      {/* Label — opaque pill with subtle border + shadow */}
      {rel.label && (
        <g className="pointer-events-none">
          {/* Pill shadow for depth */}
          <rect
            x={labelPos.x - (rel.label.length * 3.3 + 10)}
            y={labelPos.y - 9}
            width={rel.label.length * 6.6 + 20}
            height={19}
            rx={9.5}
            fill="rgba(0,0,0,0.3)"
            style={{ filter: "blur(3px)" }}
          />
          {/* Pill background */}
          <rect
            x={labelPos.x - (rel.label.length * 3.3 + 10)}
            y={labelPos.y - 9}
            width={rel.label.length * 6.6 + 20}
            height={19}
            rx={9.5}
            fill="var(--lld-canvas-bg-deep, #0f0f1a)"
            stroke="var(--lld-rel-stroke)"
            strokeWidth="0.6"
            opacity="0.95"
          />
          <text
            x={labelPos.x}
            y={labelPos.y + 4}
            textAnchor="middle"
            fill="var(--lld-rel-stroke)"
            fontSize="10"
            fontStyle="italic"
            letterSpacing="0.3"
          >
            {rel.label}
          </text>
        </g>
      )}
      {/* Source cardinality — small pill */}
      {rel.sourceCardinality && (
        <g className="pointer-events-none">
          <rect
            x={srcCardPos.x - (rel.sourceCardinality.length * 3.5 + 5)}
            y={srcCardPos.y - 8}
            width={rel.sourceCardinality.length * 7 + 10}
            height={15}
            rx={7.5}
            fill="var(--lld-canvas-bg-deep, #0f0f1a)"
            opacity="0.85"
          />
          <text
            x={srcCardPos.x}
            y={srcCardPos.y + 3}
            textAnchor="middle"
            fill="var(--lld-rel-stroke)"
            fontSize="10"
            fontWeight="600"
          >
            {rel.sourceCardinality}
          </text>
        </g>
      )}
      {/* Target cardinality — small pill */}
      {rel.targetCardinality && (
        <g className="pointer-events-none">
          <rect
            x={tgtCardPos.x - (rel.targetCardinality.length * 3.5 + 5)}
            y={tgtCardPos.y - 8}
            width={rel.targetCardinality.length * 7 + 10}
            height={15}
            rx={7.5}
            fill="var(--lld-canvas-bg-deep, #0f0f1a)"
            opacity="0.85"
          />
          <text
            x={tgtCardPos.x}
            y={tgtCardPos.y + 3}
            textAnchor="middle"
            fill="var(--lld-rel-stroke)"
            fontSize="10"
            fontWeight="600"
          >
            {rel.targetCardinality}
          </text>
        </g>
      )}
    </motion.g>
  );
});

// ── Connection Drag State ─────────────────────────────────

interface ConnectionDragState {
  sourceClassId: string;
  sourceSide: "top" | "bottom" | "left" | "right";
  currentX: number;
  currentY: number;
}

// ── Relationship Type Picker ─────────────────────────────

interface RelationshipTypePickerProps {
  x: number;
  y: number;
  onSelect: (type: UMLRelationshipType, label: string, srcCard: string, tgtCard: string) => void;
  onCancel: () => void;
}

const RELATIONSHIP_TYPE_OPTIONS: { type: UMLRelationshipType; label: string; description: string }[] = [
  { type: "inheritance", label: "Inheritance", description: "extends (solid + triangle)" },
  { type: "realization", label: "Realization", description: "implements (dashed + triangle)" },
  { type: "composition", label: "Composition", description: "has-a, owns (filled diamond)" },
  { type: "aggregation", label: "Aggregation", description: "has-a, shared (hollow diamond)" },
  { type: "association", label: "Association", description: "uses (open arrow)" },
  { type: "dependency", label: "Dependency", description: "depends on (dashed + arrow)" },
];

function RelationshipTypePicker({ x, y, onSelect, onCancel }: RelationshipTypePickerProps) {
  const [selectedType, setSelectedType] = useState<UMLRelationshipType>("association");
  const [relLabel, setRelLabel] = useState("");
  const [srcCard, setSrcCard] = useState("");
  const [tgtCard, setTgtCard] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onCancel]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onCancel]);

  return (
    <div
      ref={pickerRef}
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 50,
      }}
      className="w-64 rounded-xl border border-border/30 bg-background/90 backdrop-blur-xl shadow-2xl"
    >
      <div className="border-b border-border/30 px-3 py-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          New Relationship
        </h3>
      </div>
      <div className="p-2 space-y-2">
        {/* Type selection */}
        <div className="space-y-0.5">
          {RELATIONSHIP_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => setSelectedType(opt.type)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] transition-colors",
                selectedType === opt.type
                  ? "bg-primary/10 text-primary"
                  : "text-foreground-muted hover:bg-accent hover:text-foreground",
              )}
            >
              <span className="font-medium">{opt.label}</span>
              <span className="ml-auto text-[9px] text-foreground-subtle">{opt.description}</span>
            </button>
          ))}
        </div>
        {/* Label */}
        <div>
          <label className="block text-[10px] font-medium text-foreground-subtle mb-0.5">
            Label (optional)
          </label>
          <input
            type="text"
            value={relLabel}
            onChange={(e) => setRelLabel(e.target.value)}
            placeholder="e.g. creates, uses"
            className="w-full rounded-lg border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1 text-[11px] text-foreground placeholder:text-foreground-subtle/40 focus:border-primary focus:outline-none"
          />
        </div>
        {/* Cardinality */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-foreground-subtle mb-0.5">
              Source cardinality
            </label>
            <input
              type="text"
              value={srcCard}
              onChange={(e) => setSrcCard(e.target.value)}
              placeholder="e.g. 1, 0..*"
              className="w-full rounded-lg border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1 text-[11px] text-foreground placeholder:text-foreground-subtle/40 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-foreground-subtle mb-0.5">
              Target cardinality
            </label>
            <input
              type="text"
              value={tgtCard}
              onChange={(e) => setTgtCard(e.target.value)}
              placeholder="e.g. *, 1..n"
              className="w-full rounded-lg border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1 text-[11px] text-foreground placeholder:text-foreground-subtle/40 focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        {/* Create button */}
        <button
          onClick={() => onSelect(selectedType, relLabel, srcCard, tgtCard)}
          className="w-full rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-colors hover:bg-primary/90"
        >
          Create Relationship
        </button>
      </div>
    </div>
  );
}

// ── Canvas Component ─────────────────────────────────────

interface LLDCanvasProps {
  classes: UMLClass[];
  relationships: UMLRelationship[];
  selectedClassId: string | null;
  onSelectClass: (id: string | null) => void;
  onDragClass: (id: string, dx: number, dy: number) => void;
  patternName: string | null;
  editingNameId: string | null;
  editingNameValue: string;
  onStartEditName: (id: string) => void;
  onChangeEditName: (value: string) => void;
  onCommitEditName: () => void;
  hoveredClassId: string | null;
  onHoverClass: (id: string | null) => void;
  onCreateRelationship: (sourceId: string, targetId: string, type: UMLRelationshipType, label: string, srcCard: string, tgtCard: string) => void;
  /** Called when user clicks "Load Observer Pattern" in the empty state CTA */
  onLoadObserver?: () => void;
  /** Dagre-computed edge routing points, keyed by relationship id */
  edgePoints?: Record<string, Array<{ x: number; y: number }>>;
  /** Callback to trigger dagre auto-layout */
  onAutoLayout?: () => void;
}

export const LLDCanvas = memo(function LLDCanvas({
  classes,
  relationships,
  selectedClassId,
  onSelectClass,
  onDragClass,
  patternName,
  editingNameId,
  editingNameValue,
  onStartEditName,
  onChangeEditName,
  onCommitEditName,
  hoveredClassId,
  onHoverClass,
  onCreateRelationship,
  onLoadObserver,
  edgePoints,
  onAutoLayout,
}: LLDCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    zoom: zoomState,
    svgTransform: zoomTransform,
    zoomPercent,
    handlePanStart: handleZoomPanStart,
    handlePanMove: handleZoomPanMove,
    handlePanEnd: handleZoomPanEnd,
    zoomIn,
    zoomOut,
    zoomReset,
    zoomFit,
    setViewportPosition,
  } = useSVGZoomPan(svgRef);

  // Auto-fit zoom when diagram content changes (pattern/problem switch)
  const classIdsKey = useMemo(() => classes.map((c) => c.id).join(","), [classes]);
  useEffect(() => {
    if (classes.length > 0) zoomFit(contentBounds);
  }, [classIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track container pixel dimensions for Minimap viewport scaling
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const [connectionDrag, setConnectionDrag] = useState<ConnectionDragState | null>(null);
  const [pickerState, setPickerState] = useState<{
    sourceId: string;
    targetId: string;
    x: number;
    y: number;
  } | null>(null);

  const [aiReviewOpen, setAiReviewOpen] = useState(false);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const edgeDelay = useMemo(() => classes.length * 0.08 + 0.15, [classes.length]);

  // Focus mode: compute which class IDs are connected to the hovered class
  const connectedIds = useMemo(() => {
    if (!hoveredClassId) return null;
    const ids = new Set<string>([hoveredClassId]);
    for (const rel of relationships) {
      if (rel.source === hoveredClassId) ids.add(rel.target);
      if (rel.target === hoveredClassId) ids.add(rel.source);
    }
    return ids;
  }, [hoveredClassId, relationships]);

  const zoomScaleRef = useRef(zoomState.scale);
  zoomScaleRef.current = zoomState.scale;
  const handleZoomAwareDrag = useCallback(
    (id: string, dx: number, dy: number) => {
      const s = zoomScaleRef.current;
      onDragClass(id, dx / s, dy / s);
    },
    [onDragClass],
  );

  const classById = useMemo(() => {
    const map = new Map<string, UMLClass>();
    for (const c of classes) map.set(c.id, c);
    return map;
  }, [classes]);

  // Pre-compute port offsets so edges sharing the same box-side are spread apart.
  // Key = "classId:side:src|tgt:relId", value = offsetPx
  // siblingCounts: key = relId, value = max group size across src/tgt ports
  const { portOffsets, siblingCounts } = useMemo(() => {
    const offsets = new Map<string, number>();
    const counts = new Map<string, number>();
    // Group edges by (classId + side + role)
    const groups = new Map<string, string[]>();

    for (const rel of relationships) {
      const srcCls = classById.get(rel.source);
      const tgtCls = classById.get(rel.target);
      if (!srcCls || !tgtCls) continue;
      const srcC = classCenter(srcCls);
      const tgtC = classCenter(tgtCls);
      const rawSrc = borderPoint(srcCls, tgtC.cx, tgtC.cy);
      const rawTgt = borderPoint(tgtCls, srcC.cx, srcC.cy);
      const sSide = exitSide(srcCls, rawSrc);
      const tSide = exitSide(tgtCls, rawTgt);

      const sKey = `${rel.source}:${sSide}:src`;
      const tKey = `${rel.target}:${tSide}:tgt`;
      if (!groups.has(sKey)) groups.set(sKey, []);
      groups.get(sKey)!.push(rel.id);
      if (!groups.has(tKey)) groups.set(tKey, []);
      groups.get(tKey)!.push(rel.id);
    }

    // For groups with >1 edge, spread them with PORT_SPREAD gap
    const PORT_SPREAD = 28;
    for (const [key, relIds] of groups) {
      if (relIds.length <= 1) {
        offsets.set(`${key}:${relIds[0]}`, 0);
        continue;
      }
      const total = relIds.length;
      for (let i = 0; i < total; i++) {
        const off = (i - (total - 1) / 2) * PORT_SPREAD;
        offsets.set(`${key}:${relIds[i]}`, off);
      }
      // Track max sibling count per edge (take the larger of src/tgt group)
      for (const relId of relIds) {
        counts.set(relId, Math.max(counts.get(relId) ?? 0, total));
      }
    }
    return { portOffsets: offsets, siblingCounts: counts };
  }, [relationships, classById]);

  // Raw content bounds (no padding) — used by zoomFit
  const contentBounds = useMemo(() => {
    if (classes.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of classes) {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + classBoxWidth(c));
      maxY = Math.max(maxY, c.y + classBoxHeight(c));
    }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }, [classes]);

  const viewBox = useMemo(() => {
    if (classes.length === 0)
      return { x: -50, y: -50, w: 800, h: 600 };
    const pad = CANVAS_VIEWBOX_PAD;
    return {
      x: contentBounds.x - pad,
      y: contentBounds.y - pad,
      w: contentBounds.w + pad * 2,
      h: contentBounds.h + pad * 2,
    };
  }, [classes]);

  const screenToSVG = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: clientX, y: clientY };
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: clientX, y: clientY };
      const svgPt = pt.matrixTransform(ctm.inverse());
      return { x: svgPt.x, y: svgPt.y };
    },
    [],
  );

  const handleConnectionDragStart = useCallback(
    (classId: string, side: "top" | "bottom" | "left" | "right", e: React.PointerEvent) => {
      e.stopPropagation();
      const cls = classes.find((c) => c.id === classId);
      if (!cls) return;
      const h = classBoxHeight(cls);
      const cw = classBoxWidth(cls);
      let cx: number, cy: number;
      switch (side) {
        case "top": cx = cls.x + cw / 2; cy = cls.y; break;
        case "bottom": cx = cls.x + cw / 2; cy = cls.y + h; break;
        case "left": cx = cls.x; cy = cls.y + h / 2; break;
        case "right": cx = cls.x + cw; cy = cls.y + h / 2; break;
      }
      setConnectionDrag({
        sourceClassId: classId,
        sourceSide: side,
        currentX: cx,
        currentY: cy,
      });
    },
    [classes],
  );

  useEffect(() => {
    if (!connectionDrag) return;

    const handleMove = (e: PointerEvent) => {
      const svgPt = screenToSVG(e.clientX, e.clientY);
      setConnectionDrag((prev) =>
        prev ? { ...prev, currentX: svgPt.x, currentY: svgPt.y } : null,
      );
    };

    const handleUp = (e: PointerEvent) => {
      if (!connectionDrag) return;
      const svgPt = screenToSVG(e.clientX, e.clientY);
      const targetCls = classes.find((c) => {
        if (c.id === connectionDrag.sourceClassId) return false;
        const h = classBoxHeight(c);
        return (
          svgPt.x >= c.x &&
          svgPt.x <= c.x + classBoxWidth(c) &&
          svgPt.y >= c.y &&
          svgPt.y <= c.y + h
        );
      });
      if (targetCls && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPickerState({
          sourceId: connectionDrag.sourceClassId,
          targetId: targetCls.id,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      setConnectionDrag(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [connectionDrag, classes, screenToSVG]);

  const handlePickerSelect = useCallback(
    (type: UMLRelationshipType, label: string, srcCard: string, tgtCard: string) => {
      if (!pickerState) return;
      onCreateRelationship(pickerState.sourceId, pickerState.targetId, type, label, srcCard, tgtCard);
      setPickerState(null);
    },
    [pickerState, onCreateRelationship],
  );

  const handlePickerCancel = useCallback(() => {
    setPickerState(null);
  }, []);

  const handleBgClick = useCallback(() => {
    onSelectClass(null);
    setPickerState(null);
  }, [onSelectClass]);

  if (classes.length === 0) {
    return <CanvasEmptyState onLoadObserver={onLoadObserver} />;
  }

  let previewLineStart: { x: number; y: number } | null = null;
  if (connectionDrag) {
    const srcCls = classes.find((c) => c.id === connectionDrag.sourceClassId);
    if (srcCls) {
      const h = classBoxHeight(srcCls);
      const sw = classBoxWidth(srcCls);
      switch (connectionDrag.sourceSide) {
        case "top": previewLineStart = { x: srcCls.x + sw / 2, y: srcCls.y }; break;
        case "bottom": previewLineStart = { x: srcCls.x + sw / 2, y: srcCls.y + h }; break;
        case "left": previewLineStart = { x: srcCls.x, y: srcCls.y + h / 2 }; break;
        case "right": previewLineStart = { x: srcCls.x + sw, y: srcCls.y + h / 2 }; break;
      }
    }
  }

  return (
    <div className="flex h-full flex-col">
      {(patternName || classes.length > 0) && (
        <div className="flex items-center gap-2 border-b border-border/30 bg-elevated/50 backdrop-blur-sm px-4 py-2">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            {patternName ?? "Class Diagram"}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <TooltipProvider delayDuration={200}>
              {(["interface", "abstract", "enum", "class"] as const).map((st) => (
                <div key={st} className="flex items-center gap-1">
                  <div
                    className="h-2.5 w-2.5 rounded-lg border"
                    style={{ borderColor: STEREOTYPE_BORDER_COLOR[st] }}
                  />
                  <span className="text-[10px] text-foreground-subtle capitalize">
                    {st}
                  </span>
                </div>
              ))}
              <div className="mx-1 h-3 w-px bg-border/30" />
              {/* ── UML Relationship Legend with mini-icons ── */}
              {([
                { type: "inheritance" as const, label: "Inheritance", dash: false, marker: "triangle" },
                { type: "composition" as const, label: "Composition", dash: false, marker: "diamond-filled" },
                { type: "aggregation" as const, label: "Aggregation", dash: false, marker: "diamond-hollow" },
              ] as const).map((item) => (
                <Tooltip key={item.type}>
                  <TooltipTrigger asChild>
                    <span className="flex cursor-help items-center gap-1">
                      <svg width="28" height="12" viewBox="0 0 28 12" className="shrink-0">
                        <line x1="0" y1="6" x2="18" y2="6"
                          stroke="var(--lld-rel-stroke)" strokeWidth="1.5"
                          strokeDasharray={item.dash ? "4 3" : undefined} />
                        {item.marker === "triangle" && (
                          <path d="M 18 1 L 27 6 L 18 11 Z" fill="var(--lld-canvas-bg-deep, #0f0f1a)" stroke="var(--lld-rel-stroke)" strokeWidth="1.5" />
                        )}
                        {item.marker === "diamond-filled" && (
                          <path d="M 0 6 L 6 2 L 12 6 L 6 10 Z" fill="var(--lld-rel-stroke)" stroke="var(--lld-rel-stroke)" strokeWidth="1" transform="translate(0,0)" />
                        )}
                        {item.marker === "diamond-hollow" && (
                          <path d="M 0 6 L 6 2 L 12 6 L 6 10 Z" fill="var(--lld-canvas-bg-deep, #0f0f1a)" stroke="var(--lld-rel-stroke)" strokeWidth="1.5" />
                        )}
                      </svg>
                      <span className="text-[10px] text-foreground-subtle">{item.label}</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                    {RELATIONSHIP_TOOLTIPS[item.type]}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            {classes.length > 0 && (
              <>
                <div className="mx-1 h-3 w-px bg-border/30" />
                <div className="flex items-center gap-0.5">
                  <button onClick={zoomOut} className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-foreground-muted hover:bg-accent hover:text-foreground" title="Zoom out" aria-label="Zoom out">-</button>
                  <span className="min-w-[2.5rem] text-center text-[9px] font-medium text-foreground-subtle">{zoomPercent}%</span>
                  <button onClick={zoomIn} className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-foreground-muted hover:bg-accent hover:text-foreground" title="Zoom in" aria-label="Zoom in">+</button>
                  <button onClick={() => zoomFit(contentBounds)} className="ml-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium text-foreground-muted hover:bg-accent hover:text-foreground" title="Fit to view" aria-label="Fit to view">Fit</button>
                  <button onClick={zoomReset} className="rounded px-1.5 py-0.5 text-[9px] font-medium text-foreground-muted hover:bg-accent hover:text-foreground" title="Reset to 100%" aria-label="Reset to 100%">100%</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div ref={containerRef} className="relative flex-1 overflow-hidden bg-background">
        <svg
          ref={svgRef}
          data-lld-canvas-svg
          viewBox="0 0 2000 2000"
          preserveAspectRatio="xMinYMin meet"
          className="h-full w-full"
          style={{ minHeight: 400 }}
          onClick={handleBgClick}
          onPointerDown={handleZoomPanStart}
          onPointerMove={handleZoomPanMove}
          onPointerUp={handleZoomPanEnd}
        >
          <RelationshipDefs />
          <defs>
            {/* Dot grid — Figma-style professional canvas feel */}
            <pattern id="lld-grid" width={CANVAS_GRID_SIZE} height={CANVAS_GRID_SIZE} patternUnits="userSpaceOnUse">
              <circle
                cx={CANVAS_GRID_SIZE / 2}
                cy={CANVAS_GRID_SIZE / 2}
                r="0.8"
                fill="var(--lld-canvas-border)"
                opacity="0.3"
              />
            </pattern>
            {/* Task LLD-150: radial gradient overlay — lighter at center, darker at edges */}
            <radialGradient id="lld-canvas-vignette" cx="50%" cy="50%" r="75%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="var(--lld-canvas-bg)" stopOpacity="0" />
              <stop offset="80%" stopColor="var(--lld-canvas-bg)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--lld-canvas-bg-deep)" stopOpacity="0.2" />
            </radialGradient>
            {/* Glassmorphism glow filter for selected/active elements */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <rect
            x={-500}
            y={-500}
            width={3000}
            height={3000}
            fill="url(#lld-grid)"
          />
          {/* Radial vignette overlay — lighter center, darker edges for depth */}
          <rect
            x={-500}
            y={-500}
            width={3000}
            height={3000}
            fill="url(#lld-canvas-vignette)"
            pointerEvents="none"
          />

          {/* Ambient floating particles — creates a living canvas feel */}
          {!reducedMotion && (
            <g pointerEvents="none">
              {Array.from({ length: 12 }, (_, i) => {
                const cx = Math.random() * 2000;
                const cy = Math.random() * 2000;
                const dx = (Math.random() - 0.5) * 80;
                const dy = (Math.random() - 0.5) * 80;
                return (
                  <circle
                    key={`particle-${i}`}
                    cx={cx}
                    cy={cy}
                    r={Math.random() * 1.5 + 0.5}
                    fill="var(--primary)"
                    className="lld-particle"
                    style={{
                      "--p-dx": `${dx}px`,
                      "--p-dy": `${dy}px`,
                      "--p-duration": `${6 + Math.random() * 6}s`,
                      "--p-delay": `${Math.random() * 6}s`,
                      "--p-opacity": `${0.1 + Math.random() * 0.15}`,
                    } as React.CSSProperties}
                  />
                );
              })}
            </g>
          )}

          <g transform={zoomTransform} style={{ transformOrigin: "0 0" }}>
            {relationships.map((rel) => {
              const srcCls = classById.get(rel.source);
              const tgtCls = classById.get(rel.target);
              if (!srcCls || !tgtCls) return null;
              const sc = classCenter(srcCls);
              const tc = classCenter(tgtCls);
              const rs = borderPoint(srcCls, tc.cx, tc.cy);
              const rt = borderPoint(tgtCls, sc.cx, sc.cy);
              const sSide = exitSide(srcCls, rs);
              const tSide = exitSide(tgtCls, rt);
              const sOff = portOffsets.get(`${rel.source}:${sSide}:src:${rel.id}`) ?? 0;
              const tOff = portOffsets.get(`${rel.target}:${tSide}:tgt:${rel.id}`) ?? 0;
              const isHighlighted = hoveredClassId != null && (rel.source === hoveredClassId || rel.target === hoveredClassId);
              const isDimmedEdge = hoveredClassId != null && !isHighlighted;
              return <UMLEdge key={rel.id} rel={rel} classById={classById} allClasses={classes} edgeDelay={edgeDelay} reducedMotion={reducedMotion} routePoints={edgePoints?.[rel.id]} srcPortOffset={sOff} tgtPortOffset={tOff} highlighted={isHighlighted} dimmed={isDimmedEdge} siblingCount={siblingCounts.get(rel.id) ?? 1} />;
            })}

            {connectionDrag && previewLineStart && (
              <line
                x1={previewLineStart.x}
                y1={previewLineStart.y}
                x2={connectionDrag.currentX}
                y2={connectionDrag.currentY}
                stroke="var(--lld-canvas-selected)"
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity={0.7}
                pointerEvents="none"
              />
            )}

            {classes.map((cls, i) => (
              <UMLClassBox
                key={cls.id}
                cls={cls}
                isSelected={selectedClassId === cls.id}
                onSelect={onSelectClass}
                onDrag={handleZoomAwareDrag}
                editingNameId={editingNameId}
                editingNameValue={editingNameValue}
                onStartEditName={onStartEditName}
                onChangeEditName={onChangeEditName}
                onCommitEditName={onCommitEditName}
                isHovered={hoveredClassId === cls.id}
                onHover={onHoverClass}
                onConnectionDragStart={handleConnectionDragStart}
                index={i}
                reducedMotion={reducedMotion}
                dimmed={connectedIds != null && !connectedIds.has(cls.id)}
              />
            ))}
          </g>
        </svg>

        {classes.length > 0 && (
          <Minimap
            classes={classes}
            relationships={relationships}
            viewportX={zoomState.translateX}
            viewportY={zoomState.translateY}
            viewportScale={zoomState.scale}
            canvasWidth={containerSize.width}
            canvasHeight={containerSize.height}
            onViewportChange={setViewportPosition}
          />
        )}

        {/* AI Review + Auto Layout buttons — top-left of canvas */}
        {classes.length > 0 && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
            <button
              onClick={() => setAiReviewOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-xl border border-primary/30 backdrop-blur-md bg-primary/10 px-3 py-2 text-xs font-semibold text-primary shadow-lg transition-all hover:bg-primary/20 hover:shadow-[0_0_20px_rgba(110,86,207,0.25)]"
              title="AI Review"
              aria-label="Run AI review on diagram"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Review
            </button>
            {onAutoLayout && (
              <button
                onClick={onAutoLayout}
                className="flex items-center gap-1.5 rounded-xl border border-border/30 backdrop-blur-md bg-elevated/60 px-3 py-2 text-xs font-semibold text-foreground-muted shadow-lg transition-all hover:bg-elevated hover:text-foreground hover:border-primary/30"
                title="Auto-layout diagram using hierarchical algorithm"
                aria-label="Auto layout"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Auto Layout
              </button>
            )}
          </div>
        )}

        <AIReviewPanel
          isOpen={aiReviewOpen}
          onClose={() => setAiReviewOpen(false)}
          classes={classes}
          relationships={relationships}
        />

        {pickerState && (
          <RelationshipTypePicker
            x={pickerState.x}
            y={pickerState.y}
            onSelect={handlePickerSelect}
            onCancel={handlePickerCancel}
          />
        )}
        {false && /* Zoom controls moved to header bar */ (
          <ZoomToolbar
            zoomPercent={zoomPercent}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onZoomFit={zoomFit}
            onZoomReset={zoomReset}
          />
        )}
      </div>
    </div>
  );
});
