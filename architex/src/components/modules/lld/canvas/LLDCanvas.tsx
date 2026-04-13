"use client";

/**
 * LLD Canvas — UML class diagram canvas with zoom/pan, drag, connection handles.
 * Split from LLDModule.tsx (LLD-037).
 */

import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Layers } from "lucide-react";
import { CanvasEmptyState } from "@/components/shared/lld-empty-states";
import { cn } from "@/lib/utils";
import type { UMLClass, UMLRelationship, UMLRelationshipType } from "@/lib/lld";
import { motion } from "motion/react";
import {
  CLASS_BOX_WIDTH,
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
    setZoom((prev) => {
      const newScale = Math.min(ZOOM_MAX, prev.scale * (1 + ZOOM_STEP));
      return { ...prev, scale: newScale };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => {
      const newScale = Math.max(ZOOM_MIN, prev.scale * (1 - ZOOM_STEP));
      return { ...prev, scale: newScale };
    });
  }, []);

  const zoomReset = useCallback(() => {
    setZoom({ scale: 1, translateX: 0, translateY: 0 });
  }, []);

  const zoomFit = useCallback(() => {
    setZoom({ scale: 1, translateX: 0, translateY: 0 });
  }, []);

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
    <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-xl border border-border/30 backdrop-blur-md bg-background/60 px-1.5 py-1 shadow-lg">
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

export const RelationshipDefs = memo(function RelationshipDefs() {
  return (
    <defs>
      {/* Inheritance: solid line + hollow triangle */}
      <marker
        id="arrow-inheritance"
        viewBox="0 0 12 12"
        refX="12"
        refY="6"
        markerWidth="12"
        markerHeight="12"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 12 6 L 0 12 Z" fill="none" stroke="var(--lld-canvas-edge)" strokeWidth="1.5" />
      </marker>

      {/* Realization: dashed line + hollow triangle */}
      <marker
        id="arrow-realization"
        viewBox="0 0 12 12"
        refX="12"
        refY="6"
        markerWidth="12"
        markerHeight="12"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 12 6 L 0 12 Z" fill="none" stroke="var(--lld-canvas-edge)" strokeWidth="1.5" />
      </marker>

      {/* Composition: filled diamond */}
      <marker
        id="arrow-composition"
        viewBox="0 0 14 10"
        refX="0"
        refY="5"
        markerWidth="14"
        markerHeight="10"
        orient="auto-start-reverse"
      >
        <path d="M 0 5 L 7 0 L 14 5 L 7 10 Z" fill="var(--lld-canvas-edge)" stroke="var(--lld-canvas-edge)" strokeWidth="1" />
      </marker>

      {/* Aggregation: hollow diamond */}
      <marker
        id="arrow-aggregation"
        viewBox="0 0 14 10"
        refX="0"
        refY="5"
        markerWidth="14"
        markerHeight="10"
        orient="auto-start-reverse"
      >
        <path d="M 0 5 L 7 0 L 14 5 L 7 10 Z" fill="none" stroke="var(--lld-canvas-edge)" strokeWidth="1.5" />
      </marker>

      {/* Association: open arrow */}
      <marker
        id="arrow-association"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="10"
        markerHeight="10"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="var(--lld-canvas-edge)" strokeWidth="1.5" />
      </marker>

      {/* Dependency: open arrow (dashed line is on the path) */}
      <marker
        id="arrow-dependency"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="10"
        markerHeight="10"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="var(--lld-canvas-edge)" strokeWidth="1.5" />
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
}: UMLClassBoxProps) {
  const borderColor = STEREOTYPE_BORDER_COLOR[cls.stereotype];
  const stereo = STEREOTYPE_LABEL[cls.stereotype];
  const h = classBoxHeight(cls);
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
    { side: "top", cx: cls.x + CLASS_BOX_WIDTH / 2, cy: cls.y },
    { side: "bottom", cx: cls.x + CLASS_BOX_WIDTH / 2, cy: cls.y + h },
    { side: "left", cx: cls.x, cy: cls.y + h / 2 },
    { side: "right", cx: cls.x + CLASS_BOX_WIDTH, cy: cls.y + h / 2 },
  ];

  return (
    <motion.g
      onPointerDown={handlePointerDown}
      onPointerEnter={() => onHover(cls.id)}
      onPointerLeave={() => onHover(null)}
      style={{ cursor: "grab" }}
      filter={isSelected ? "url(#glow)" : undefined}
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
      {/* Shadow */}
      <rect
        x={cls.x + CLASS_BOX_SHADOW_OFFSET}
        y={cls.y + CLASS_BOX_SHADOW_OFFSET}
        width={CLASS_BOX_WIDTH}
        height={h}
        rx={4}
        fill="rgba(0,0,0,0.25)"
      />
      {/* Background */}
      <rect
        x={cls.x}
        y={cls.y}
        width={CLASS_BOX_WIDTH}
        height={h}
        rx={4}
        fill="var(--lld-canvas-bg)"
        stroke={isSelected ? "var(--lld-canvas-selected)" : borderColor}
        strokeWidth={isSelected ? 2.5 : 1.5}
      />
      {/* Header background */}
      <rect
        x={cls.x}
        y={cls.y}
        width={CLASS_BOX_WIDTH}
        height={CLASS_HEADER_HEIGHT + (hasStereo ? STEREOTYPE_LABEL_HEIGHT : 0)}
        rx={4}
        fill={borderColor}
        opacity={0.094}
      />
      {/* Bottom corners overlap fix */}
      <rect
        x={cls.x}
        y={cls.y + CLASS_HEADER_HEIGHT + (hasStereo ? STEREOTYPE_LABEL_HEIGHT / 2 : 0)}
        width={CLASS_BOX_WIDTH}
        height={STEREOTYPE_LABEL_HEIGHT / 2}
        fill={borderColor}
        opacity={0.094}
      />

      {/* Stereotype label */}
      {hasStereo && (
        <text
          x={cls.x + CLASS_BOX_WIDTH / 2}
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
          width={CLASS_BOX_WIDTH - 20}
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
          x={cls.x + CLASS_BOX_WIDTH / 2}
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
        x2={cls.x + CLASS_BOX_WIDTH}
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
        x2={cls.x + CLASS_BOX_WIDTH}
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
          {meth.name}({meth.params.length > 0 ? "..." : ""})
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

interface UMLEdgeProps {
  rel: UMLRelationship;
  classById: Map<string, UMLClass>;
  edgeDelay: number;
  reducedMotion: boolean;
}

const UMLEdge = memo(function UMLEdge({ rel, classById, edgeDelay, reducedMotion }: UMLEdgeProps) {
  const srcCls = classById.get(rel.source);
  const tgtCls = classById.get(rel.target);
  if (!srcCls || !tgtCls) return null;

  const srcCenter = classCenter(srcCls);
  const tgtCenter = classCenter(tgtCls);

  const src = borderPoint(srcCls, tgtCenter.cx, tgtCenter.cy);
  const tgt = borderPoint(tgtCls, srcCenter.cx, srcCenter.cy);

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

  const midX = (src.x + tgt.x) / 2;
  const midY = (src.y + tgt.y) / 2;

  return (
    <motion.g
      {...(reducedMotion
        ? {}
        : {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { delay: edgeDelay, duration: 0.3 },
          })}
    >
      <line
        x1={src.x}
        y1={src.y}
        x2={tgt.x}
        y2={tgt.y}
        stroke="var(--lld-canvas-border)"
        strokeWidth="1.5"
        strokeDasharray={isDashed ? "6 4" : undefined}
        markerEnd={markerMap[rel.type] || undefined}
        markerStart={
          hasDiamond
            ? `url(#arrow-${rel.type})`
            : undefined
        }
      />
      {/* Label */}
      {rel.label && (
        <text
          x={midX}
          y={midY - 8}
          textAnchor="middle"
          fill="var(--lld-canvas-edge)"
          fontSize="11"
          fontStyle="italic"
        >
          {rel.label}
        </text>
      )}
      {/* Cardinality */}
      {rel.sourceCardinality && (
        <text
          x={src.x + (tgt.x > src.x ? 14 : -14)}
          y={src.y + (tgt.y > src.y ? 16 : -8)}
          textAnchor="middle"
          fill="var(--lld-canvas-edge)"
          fontSize="11"
        >
          {rel.sourceCardinality}
        </text>
      )}
      {rel.targetCardinality && (
        <text
          x={tgt.x + (src.x > tgt.x ? 14 : -14)}
          y={tgt.y + (src.y > tgt.y ? 16 : -8)}
          textAnchor="middle"
          fill="var(--lld-canvas-edge)"
          fontSize="11"
        >
          {rel.targetCardinality}
        </text>
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
  } = useSVGZoomPan(svgRef);
  const [connectionDrag, setConnectionDrag] = useState<ConnectionDragState | null>(null);
  const [pickerState, setPickerState] = useState<{
    sourceId: string;
    targetId: string;
    x: number;
    y: number;
  } | null>(null);

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

  const viewBox = useMemo(() => {
    if (classes.length === 0)
      return { x: -50, y: -50, w: 800, h: 600 };
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const c of classes) {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + CLASS_BOX_WIDTH);
      maxY = Math.max(maxY, c.y + classBoxHeight(c));
    }
    const pad = CANVAS_VIEWBOX_PAD;
    return {
      x: minX - pad,
      y: minY - pad,
      w: maxX - minX + CLASS_BOX_WIDTH + pad * 2,
      h: maxY - minY + pad * 3,
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
      let cx: number, cy: number;
      switch (side) {
        case "top": cx = cls.x + CLASS_BOX_WIDTH / 2; cy = cls.y; break;
        case "bottom": cx = cls.x + CLASS_BOX_WIDTH / 2; cy = cls.y + h; break;
        case "left": cx = cls.x; cy = cls.y + h / 2; break;
        case "right": cx = cls.x + CLASS_BOX_WIDTH; cy = cls.y + h / 2; break;
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
          svgPt.x <= c.x + CLASS_BOX_WIDTH &&
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
      switch (connectionDrag.sourceSide) {
        case "top": previewLineStart = { x: srcCls.x + CLASS_BOX_WIDTH / 2, y: srcCls.y }; break;
        case "bottom": previewLineStart = { x: srcCls.x + CLASS_BOX_WIDTH / 2, y: srcCls.y + h }; break;
        case "left": previewLineStart = { x: srcCls.x, y: srcCls.y + h / 2 }; break;
        case "right": previewLineStart = { x: srcCls.x + CLASS_BOX_WIDTH, y: srcCls.y + h / 2 }; break;
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
              {(["inheritance", "composition", "aggregation"] as const).map((rel) => (
                <Tooltip key={rel}>
                  <TooltipTrigger asChild>
                    <span className="cursor-help text-[10px] text-foreground-subtle capitalize underline decoration-dotted underline-offset-2">
                      {rel}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                    {RELATIONSHIP_TOOLTIPS[rel]}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>
      )}
      <div ref={containerRef} className="relative flex-1 overflow-hidden bg-background">
        <svg
          ref={svgRef}
          data-lld-canvas-svg
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          className="h-full w-full"
          style={{ minHeight: 400 }}
          onClick={handleBgClick}
          onPointerDown={handleZoomPanStart}
          onPointerMove={handleZoomPanMove}
          onPointerUp={handleZoomPanEnd}
        >
          <RelationshipDefs />
          <defs>
            <pattern id="lld-grid" width={CANVAS_GRID_SIZE} height={CANVAS_GRID_SIZE} patternUnits="userSpaceOnUse">
              <path
                d={`M ${CANVAS_GRID_SIZE} 0 L 0 0 0 ${CANVAS_GRID_SIZE}`}
                fill="none"
                stroke="#ffffff"
                strokeWidth="0.3"
                opacity="0.06"
              />
            </pattern>
            {/* Task LLD-150: radial gradient overlay — lighter at center, darker at edges */}
            <radialGradient id="lld-canvas-vignette" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="var(--lld-canvas-bg)" stopOpacity="0" />
              <stop offset="100%" stopColor="#1a1f24" stopOpacity="0.6" />
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
            x={viewBox.x}
            y={viewBox.y}
            width={viewBox.w}
            height={viewBox.h}
            fill="url(#lld-grid)"
          />
          {/* Radial vignette overlay — lighter center, darker edges for depth */}
          <rect
            x={viewBox.x}
            y={viewBox.y}
            width={viewBox.w}
            height={viewBox.h}
            fill="url(#lld-canvas-vignette)"
            pointerEvents="none"
          />

          <g transform={zoomTransform} style={{ transformOrigin: "0 0" }}>
            {relationships.map((rel) => (
              <UMLEdge key={rel.id} rel={rel} classById={classById} edgeDelay={edgeDelay} reducedMotion={reducedMotion} />
            ))}

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
              />
            ))}
          </g>
        </svg>

        <ZoomToolbar
          zoomPercent={zoomPercent}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomFit={zoomFit}
          onZoomReset={zoomReset}
        />

        {pickerState && (
          <RelationshipTypePicker
            x={pickerState.x}
            y={pickerState.y}
            onSelect={handlePickerSelect}
            onCancel={handlePickerCancel}
          />
        )}
      </div>
    </div>
  );
});
