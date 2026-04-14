"use client";

/**
 * State Machine Canvas — SVG rendering with simulation support.
 * Split from LLDModule.tsx (LLD-037).
 */

import React, { memo, useMemo, useRef, useState, useEffect } from "react";
import {
  Circle,
  Play,
  RotateCw,
  X,
  Zap,
  History,
  CheckCircle2,
} from "lucide-react";
import type { StateNode, StateTransition, StateMachineData } from "@/lib/lld";
import { motion } from "motion/react";
import { useSVGZoomPan, ZoomToolbar } from "./LLDCanvas";
import {
  SM_STATE_RX,
  SM_STATE_RY,
  SM_STATE_WIDTH,
  SM_STATE_HEIGHT,
  SM_INITIAL_DOT_R,
  CANVAS_VIEWBOX_PAD,
  CANVAS_GRID_SIZE,
  smStateColor,
  layoutStateMachine,
  smStateCenter,
  smBorderPoint,
  type StateMachineSimState,
} from "../constants";

// ── Animated Transition Edge ────────────────────────────
// Measures its own path length and runs the lld-edge-draw animation on mount.

const SMTransitionEdge = memo(function SMTransitionEdge({
  pathD,
  markerEnd,
  highlighted,
  dimmed,
  delay,
}: {
  pathD: string;
  markerEnd: string;
  highlighted: boolean;
  dimmed: boolean;
  delay: number;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
  }, [pathD]);

  const drawStyle: React.CSSProperties | undefined =
    pathLength > 0
      ? {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
          animation: `lld-edge-draw 0.4s cubic-bezier(0.4,0,0.2,1) ${delay}s forwards`,
        }
      : undefined;

  return (
    <path
      ref={pathRef}
      d={pathD}
      fill="none"
      stroke="var(--lld-canvas-edge)"
      strokeWidth={highlighted ? 2.5 : 1.5}
      markerEnd={markerEnd}
      opacity={dimmed ? 0.35 : 1}
      style={{ ...drawStyle, transition: "opacity 0.2s ease, stroke-width 0.2s ease" }}
    />
  );
});

// ── Transition Hover Tooltip ────────────────────────────
// Floating pill shown when hovering a transition arrow.

function TransitionTooltip({
  x,
  y,
  trigger,
  guard,
  action,
}: {
  x: number;
  y: number;
  trigger: string;
  guard?: string;
  action?: string;
}) {
  if (!guard && !action) return null;
  const parts: string[] = [];
  if (guard) parts.push(`[${guard}]`);
  if (action) parts.push(`/ ${action}`);
  const label = parts.join(" ");
  const estimatedW = label.length * 5.8 + 16;
  return (
    <g pointerEvents="none">
      <rect
        x={x - estimatedW / 2}
        y={y - 24}
        width={estimatedW}
        height={18}
        rx={9}
        fill="var(--lld-canvas-bg)"
        stroke="var(--lld-canvas-border)"
        strokeWidth={0.5}
        opacity={0.95}
      />
      <text
        x={x}
        y={y - 12}
        textAnchor="middle"
        fontSize="9"
        fontFamily="monospace"
        fill="var(--lld-canvas-text)"
      >
        {label}
      </text>
    </g>
  );
}

// ── State Machine Canvas Component ───────────────────────

interface StateMachineCanvasProps {
  data: StateMachineData | null;
  title: string | null;
  selectedStateId: string | null;
  onSelectState: (id: string | null) => void;
  simState?: StateMachineSimState | null;
}

export const StateMachineCanvas = memo(function StateMachineCanvas({
  data,
  title,
  selectedStateId,
  onSelectState,
  simState,
}: StateMachineCanvasProps) {
  const smSvgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    svgTransform: smZoomTransform,
    zoomPercent: smZoomPercent,
    handlePanStart: smHandlePanStart,
    handlePanMove: smHandlePanMove,
    handlePanEnd: smHandlePanEnd,
    zoomIn: smZoomIn,
    zoomOut: smZoomOut,
    zoomReset: smZoomReset,
    zoomFit: smZoomFit,
  } = useSVGZoomPan(smSvgRef);

  // ── Hover state for interactive highlighting ──────────
  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null);
  const [hoveredTransitionId, setHoveredTransitionId] = useState<string | null>(null);

  // ── Container resize tracking ─────────────────────────
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const positions = useMemo(
    () => (data ? layoutStateMachine(data) : new Map<string, { x: number; y: number }>()),
    [data],
  );

  const statesLength = data?.states.length ?? 0;

  // ── Auto-fit on load / data change / container resize ──
  useEffect(() => {
    if (statesLength > 0) smZoomFit();
  }, [statesLength, containerSize.w, containerSize.h]);

  // ── Connections from/to hovered state (for highlight) ──
  const hoveredConnections = useMemo(() => {
    if (!hoveredStateId || !data) return new Set<string>();
    const ids = new Set<string>();
    for (const t of data.transitions) {
      if (t.from === hoveredStateId || t.to === hoveredStateId) ids.add(t.id);
    }
    return ids;
  }, [hoveredStateId, data]);

  const connectedStates = useMemo(() => {
    if (!hoveredStateId || !data) return new Set<string>();
    const ids = new Set<string>([hoveredStateId]);
    for (const t of data.transitions) {
      if (t.from === hoveredStateId) ids.add(t.to);
      if (t.to === hoveredStateId) ids.add(t.from);
    }
    return ids;
  }, [hoveredStateId, data]);

  if (!data || data.states.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="text-center">
          <Circle className="mx-auto mb-3 h-16 w-16 text-foreground-subtle opacity-20" />
          <p className="text-sm text-foreground-muted">
            Select a state machine from the sidebar.
          </p>
        </div>
      </div>
    );
  }

  // ── ViewBox with minimum dimensions ───────────────────
  const contentBounds = (() => {
    let cMinX = Infinity, cMinY = Infinity, cMaxX = -Infinity, cMaxY = -Infinity;
    positions.forEach((pos) => {
      cMinX = Math.min(cMinX, pos.x);
      cMinY = Math.min(cMinY, pos.y);
      cMaxX = Math.max(cMaxX, pos.x + SM_STATE_WIDTH);
      cMaxY = Math.max(cMaxY, pos.y + SM_STATE_HEIGHT);
    });
    return { x: cMinX, y: cMinY, w: cMaxX - cMinX, h: cMaxY - cMinY };
  })();

  const pad = CANVAS_VIEWBOX_PAD;
  const rawW = contentBounds.w + 2 * pad;
  const rawH = contentBounds.h + 2 * pad + 30;
  const MIN_W = 800;
  const MIN_H = 500;
  const vbW = Math.max(rawW, MIN_W);
  const vbH = Math.max(rawH, MIN_H);
  const cx = contentBounds.x + contentBounds.w / 2;
  const cy = contentBounds.y + contentBounds.h / 2;
  const viewBox = { x: cx - vbW / 2, y: cy - vbH / 2 - 15, w: vbW, h: vbH };

  const gridSize = CANVAS_GRID_SIZE;

  const transitionPairs = new Map<string, StateTransition[]>();
  for (const t of data.transitions) {
    const key = `${t.from}->${t.to}`;
    if (!transitionPairs.has(key)) transitionPairs.set(key, []);
    transitionPairs.get(key)!.push(t);
  }

  // Seeded pseudo-random for particles (stable across re-renders)
  const particles = useMemo(() => {
    const seed = statesLength * 7 + 42;
    const rng = (i: number) => {
      const x = Math.sin(seed + i * 9301 + 49297) * 49979;
      return x - Math.floor(x);
    };
    return Array.from({ length: 12 }, (_, i) => ({
      cx: viewBox.x + rng(i * 4) * viewBox.w,
      cy: viewBox.y + rng(i * 4 + 1) * viewBox.h,
      dx: (rng(i * 4 + 2) - 0.5) * 80,
      dy: (rng(i * 4 + 3) - 0.5) * 80,
      r: rng(i * 4 + 10) * 1.5 + 0.5,
      duration: 6 + rng(i * 4 + 20) * 6,
      delay: rng(i * 4 + 30) * 6,
      opacity: 0.1 + rng(i * 4 + 40) * 0.15,
    }));
  }, [viewBox.x, viewBox.y, viewBox.w, viewBox.h, statesLength]);

  return (
    <div className="flex h-full flex-col">
      {title && (
        <div className="flex items-center gap-2 border-b border-border/30 bg-elevated/50 backdrop-blur-sm px-4 py-2">
          <Circle className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            {title}
          </span>
          <div className="ml-auto flex items-center gap-3">
            {/* Legend — using CSS variables for light/dark compatibility */}
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--lld-stereo-interface)" }} />
              <span className="text-[10px] text-foreground-subtle">Initial</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full" style={{ border: "2px solid var(--lld-stereo-enum)", boxSizing: "border-box" }} />
              <span className="text-[10px] text-foreground-subtle">Final</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--lld-canvas-border)" }} />
              <span className="text-[10px] text-foreground-subtle">State</span>
            </div>
            {/* Compact zoom controls in header */}
            <div className="mx-1 h-4 w-px bg-border/30" />
            <div className="flex items-center gap-1">
              <button
                onClick={smZoomOut}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border/50 text-[10px] font-bold text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
                title="Zoom out"
                aria-label="Zoom out"
              >
                -
              </button>
              <span className="min-w-[2rem] text-center text-[10px] font-medium text-foreground-subtle tabular-nums">
                {smZoomPercent}%
              </span>
              <button
                onClick={smZoomIn}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border/50 text-[10px] font-bold text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
                title="Zoom in"
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                onClick={smZoomFit}
                className="rounded-full bg-background/80 backdrop-blur border border-border/50 px-1.5 py-0.5 text-[9px] font-medium text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
                title="Fit to view"
                aria-label="Fit to view"
              >
                Fit
              </button>
              <button
                onClick={smZoomReset}
                className="rounded-full bg-background/80 backdrop-blur border border-border/50 px-1.5 py-0.5 text-[9px] font-medium text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
                title="Reset to 100%"
                aria-label="Reset to 100%"
              >
                100%
              </button>
            </div>
          </div>
        </div>
      )}
      <div ref={containerRef} className="relative flex-1 overflow-hidden bg-background">
        <svg
          ref={smSvgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
          style={{ minHeight: 400 }}
          onClick={() => onSelectState(null)}
          onPointerDown={smHandlePanStart}
          onPointerMove={smHandlePanMove}
          onPointerUp={smHandlePanEnd}
        >
          <defs>
            <marker
              id="sm-arrow"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 Z" fill="var(--lld-canvas-edge)" />
            </marker>
            {/* Glassmorphism glow filter for active/selected states */}
            <filter id="sm-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            {/* Colored glow filter for hovered state type */}
            <filter id="sm-hover-glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            {/* Dot grid background pattern */}
            <pattern id="sm-grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
              <circle
                cx={gridSize / 2}
                cy={gridSize / 2}
                r="0.8"
                fill="var(--lld-canvas-text-subtle)"
                opacity="0.18"
              />
            </pattern>
            {/* Vignette radial gradient — lighter center, darker edges */}
            <radialGradient id="sm-canvas-vignette" cx="50%" cy="50%" r="75%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="var(--lld-canvas-bg)" stopOpacity="0" />
              <stop offset="80%" stopColor="var(--lld-canvas-bg)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--lld-canvas-bg-deep)" stopOpacity="0.2" />
            </radialGradient>
          </defs>

          {/* Dot grid background */}
          <rect
            x={viewBox.x}
            y={viewBox.y}
            width={viewBox.w}
            height={viewBox.h}
            fill="url(#sm-grid)"
          />
          {/* Radial vignette overlay */}
          <rect
            x={viewBox.x}
            y={viewBox.y}
            width={viewBox.w}
            height={viewBox.h}
            fill="url(#sm-canvas-vignette)"
            pointerEvents="none"
          />

          {/* Ambient floating particles */}
          <g pointerEvents="none">
            {particles.map((p, i) => (
              <circle
                key={`sm-particle-${i}`}
                cx={p.cx}
                cy={p.cy}
                r={p.r}
                fill="var(--primary)"
                className="lld-particle"
                style={{
                  "--p-dx": `${p.dx}px`,
                  "--p-dy": `${p.dy}px`,
                  "--p-duration": `${p.duration}s`,
                  "--p-delay": `${p.delay}s`,
                  "--p-opacity": `${p.opacity}`,
                } as React.CSSProperties}
              />
            ))}
          </g>

          <g transform={smZoomTransform} style={{ transformOrigin: "0 0" }}>
          {/* Transitions */}
          {data.transitions.map((t, tIdx) => {
            const fromPos = positions.get(t.from);
            const toPos = positions.get(t.to);
            if (!fromPos || !toPos) return null;

            const fromC = smStateCenter(fromPos);
            const toC = smStateCenter(toPos);

            const isHighlighted = hoveredConnections.has(t.id);
            const isDimmed = hoveredStateId !== null && !isHighlighted;
            const isTransitionHovered = hoveredTransitionId === t.id;

            if (t.from === t.to) {
              const selfCx = fromPos.x + SM_STATE_WIDTH / 2;
              const topY = fromPos.y;
              const loopR = 24;
              const loopPathD = `M ${selfCx - 12} ${topY} C ${selfCx - 12} ${topY - loopR * 2}, ${selfCx + 12} ${topY - loopR * 2}, ${selfCx + 12} ${topY}`;
              return (
                <g
                  key={t.id}
                  onPointerEnter={() => setHoveredTransitionId(t.id)}
                  onPointerLeave={() => setHoveredTransitionId(null)}
                  style={{ cursor: "default" }}
                >
                  <SMTransitionEdge
                    pathD={loopPathD}
                    markerEnd="url(#sm-arrow)"
                    highlighted={isHighlighted}
                    dimmed={isDimmed}
                    delay={tIdx * 0.08}
                  />
                  {/* Wider invisible hit area for hover */}
                  <path
                    d={loopPathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="14"
                    pointerEvents="stroke"
                    onPointerEnter={() => setHoveredTransitionId(t.id)}
                    onPointerLeave={() => setHoveredTransitionId(null)}
                  />
                  <text
                    x={selfCx}
                    y={topY - loopR * 2 + 4}
                    textAnchor="middle"
                    className="text-[11px]"
                    fill="var(--lld-canvas-edge)"
                    opacity={isDimmed ? 0.35 : 1}
                  >
                    {t.trigger}
                    {t.guard ? ` [${t.guard}]` : ""}
                  </text>
                  {isTransitionHovered && (
                    <TransitionTooltip
                      x={selfCx}
                      y={topY - loopR * 2 - 10}
                      trigger={t.trigger}
                      guard={t.guard}
                      action={t.action}
                    />
                  )}
                </g>
              );
            }

            const reverseKey = `${t.to}->${t.from}`;
            const hasReverse = transitionPairs.has(reverseKey);

            const bp1 = smBorderPoint(fromPos, toC.cx, toC.cy);
            const bp2 = smBorderPoint(toPos, fromC.cx, fromC.cy);

            const dx = bp2.x - bp1.x;
            const dy = bp2.y - bp1.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            const offset = hasReverse ? 12 : 0;

            const midX = (bp1.x + bp2.x) / 2 + nx * offset;
            const midY = (bp1.y + bp2.y) / 2 + ny * offset;

            const pathD = hasReverse
              ? `M ${bp1.x} ${bp1.y} Q ${midX + nx * 20} ${midY + ny * 20} ${bp2.x} ${bp2.y}`
              : `M ${bp1.x} ${bp1.y} L ${bp2.x} ${bp2.y}`;

            const labelX = hasReverse ? midX + nx * 20 : midX;
            const labelY = hasReverse ? midY + ny * 20 : midY;

            const label = t.trigger + (t.guard ? ` [${t.guard}]` : "");

            return (
              <g
                key={t.id}
                onPointerEnter={() => setHoveredTransitionId(t.id)}
                onPointerLeave={() => setHoveredTransitionId(null)}
                style={{ cursor: "default" }}
              >
                <SMTransitionEdge
                  pathD={pathD}
                  markerEnd="url(#sm-arrow)"
                  highlighted={isHighlighted}
                  dimmed={isDimmed}
                  delay={tIdx * 0.08}
                />
                {/* Wider invisible hit area for hover */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="14"
                  pointerEvents="stroke"
                  onPointerEnter={() => setHoveredTransitionId(t.id)}
                  onPointerLeave={() => setHoveredTransitionId(null)}
                />
                <rect
                  x={labelX - label.length * 2.8}
                  y={labelY - 14}
                  width={label.length * 5.6}
                  height={14}
                  rx="3"
                  fill="var(--lld-canvas-bg)"
                  opacity={isDimmed ? 0.35 * 0.85 : 0.85}
                />
                <text
                  x={labelX}
                  y={labelY - 4}
                  textAnchor="middle"
                  className="text-[11px]"
                  fill="var(--lld-canvas-edge)"
                  opacity={isDimmed ? 0.35 : 1}
                >
                  {label}
                </text>
                {isTransitionHovered && (
                  <TransitionTooltip
                    x={labelX}
                    y={labelY - 22}
                    trigger={t.trigger}
                    guard={t.guard}
                    action={t.action}
                  />
                )}
              </g>
            );
          })}

          {/* Transition animation dot */}
          {simState?.animatingTransition && (() => {
            const t = data.transitions.find((tr) => tr.id === simState.animatingTransition);
            if (!t) return null;
            const fromPos = positions.get(t.from);
            const toPos = positions.get(t.to);
            if (!fromPos || !toPos) return null;
            const fromC = smStateCenter(fromPos);
            const toC = smStateCenter(toPos);
            const bp1 = smBorderPoint(fromPos, toC.cx, toC.cy);
            const bp2 = smBorderPoint(toPos, fromC.cx, fromC.cy);
            return (
              <circle r={6} fill="var(--lld-solid-srp)">
                <animate
                  attributeName="cx"
                  from={bp1.x}
                  to={bp2.x}
                  dur="0.6s"
                  fill="freeze"
                />
                <animate
                  attributeName="cy"
                  from={bp1.y}
                  to={bp2.y}
                  dur="0.6s"
                  fill="freeze"
                />
                <animate
                  attributeName="opacity"
                  values="1;1;0"
                  keyTimes="0;0.8;1"
                  dur="0.6s"
                  fill="freeze"
                />
              </circle>
            );
          })()}

          {/* States */}
          {data.states.map((state) => {
            const pos = positions.get(state.id);
            if (!pos) return null;
            const color = smStateColor(state);
            const isSelected = selectedStateId === state.id;
            const isSimActive = simState?.active === true;
            const isSimCurrent = isSimActive && simState?.currentStateId === state.id;
            const simOpacity = isSimActive && !isSimCurrent ? 0.5 : 1;
            const isStateHovered = hoveredStateId === state.id;
            const isDimmedState = hoveredStateId !== null && !connectedStates.has(state.id);
            const stateOpacity = isDimmedState ? 0.35 : simOpacity;

            return (
              <g
                key={state.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectState(state.id);
                }}
                onPointerEnter={() => setHoveredStateId(state.id)}
                onPointerLeave={() => setHoveredStateId(null)}
                style={{ cursor: "pointer", opacity: stateOpacity, transition: "opacity 0.2s ease" }}
                filter={(isSelected || isSimCurrent || isStateHovered) ? "url(#sm-glow)" : undefined}
              >
                {/* Hover glow ring — colored by state type */}
                {isStateHovered && !isSimCurrent && !isSelected && (
                  <rect
                    x={pos.x - 5}
                    y={pos.y - 5}
                    width={SM_STATE_WIDTH + 10}
                    height={SM_STATE_HEIGHT + 10}
                    rx={SM_STATE_RX + 3}
                    ry={SM_STATE_RY + 3}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    opacity={0.35}
                  />
                )}

                {state.isInitial && (
                  <>
                    <circle
                      cx={pos.x + SM_STATE_WIDTH / 2}
                      cy={pos.y - 28}
                      r={SM_INITIAL_DOT_R}
                      fill={color}
                    />
                    <line
                      x1={pos.x + SM_STATE_WIDTH / 2}
                      y1={pos.y - 28 + SM_INITIAL_DOT_R}
                      x2={pos.x + SM_STATE_WIDTH / 2}
                      y2={pos.y}
                      stroke={color}
                      strokeWidth="1.5"
                      markerEnd="url(#sm-arrow)"
                    />
                  </>
                )}

                {state.isFinal && (
                  <rect
                    x={pos.x - 4}
                    y={pos.y - 4}
                    width={SM_STATE_WIDTH + 8}
                    height={SM_STATE_HEIGHT + 8}
                    rx={SM_STATE_RX + 2}
                    ry={SM_STATE_RY + 2}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    opacity={0.5}
                  />
                )}

                {isSimCurrent && (
                  <rect
                    x={pos.x - 6}
                    y={pos.y - 6}
                    width={SM_STATE_WIDTH + 12}
                    height={SM_STATE_HEIGHT + 12}
                    rx={SM_STATE_RX + 4}
                    ry={SM_STATE_RY + 4}
                    fill="none"
                    stroke="var(--lld-solid-srp)"
                    strokeWidth="2"
                    opacity={0.4}
                  >
                    <animate
                      attributeName="opacity"
                      values="0.2;0.5;0.2"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </rect>
                )}

                <rect
                  x={pos.x}
                  y={pos.y}
                  width={SM_STATE_WIDTH}
                  height={SM_STATE_HEIGHT}
                  rx={SM_STATE_RX}
                  ry={SM_STATE_RY}
                  fill={color}
                  fillOpacity={isSimCurrent ? 0.2 : isStateHovered ? 0.12 : 0.07}
                  stroke={isSimCurrent ? "var(--lld-solid-srp)" : isSelected ? "var(--lld-solid-srp)" : color}
                  strokeWidth={isSimCurrent ? 2.5 : isSelected ? 2.5 : 1.5}
                />
                <text
                  x={pos.x + SM_STATE_WIDTH / 2}
                  y={pos.y + SM_STATE_HEIGHT / 2 + 4}
                  textAnchor="middle"
                  className="text-[11px] font-medium"
                  fill={isSimCurrent ? "var(--lld-solid-srp)" : color}
                  fontWeight={isSimCurrent ? "bold" : "500"}
                >
                  {state.name}
                </text>
              </g>
            );
          })}
          </g>
        </svg>
        <ZoomToolbar
          zoomPercent={smZoomPercent}
          onZoomIn={smZoomIn}
          onZoomOut={smZoomOut}
          onZoomFit={smZoomFit}
          onZoomReset={smZoomReset}
        />
      </div>
    </div>
  );
});

// ── Simulation Toast ─────────────────────────────────────

export const SimToast = memo(function SimToast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-xl border border-border/30 backdrop-blur-md bg-background/60 px-4 py-2 shadow-lg shadow-[0_0_15px_rgba(110,86,207,0.15)]"
    >
      <div className="flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-medium text-foreground">{message}</span>
      </div>
    </motion.div>
  );
});

// ── Simulation Transition Panel ──────────────────────────

export const SimTransitionPanel = memo(function SimTransitionPanel({
  transitions,
  states,
  onFireTransition,
  onReset,
  onExit,
  history,
}: {
  transitions: StateTransition[];
  states: StateNode[];
  onFireTransition: (t: StateTransition) => void;
  onReset: () => void;
  onExit: () => void;
  history: string[];
}) {
  const stateMap = useMemo(() => {
    const m = new Map<string, StateNode>();
    for (const s of states) m.set(s.id, s);
    return m;
  }, [states]);

  return (
    <div className="border-t border-border/30 bg-elevated/50 backdrop-blur-sm px-4 py-3">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Available Transitions
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1 text-[10px] font-medium text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
          >
            <RotateCw className="h-3 w-3" />
            Reset
          </button>
          <button
            onClick={onExit}
            className="flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1 text-[10px] font-medium text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Exit
          </button>
        </div>
      </div>
      {transitions.length === 0 ? (
        <p className="text-[11px] italic text-foreground-subtle">
          No transitions available from current state (final state reached).
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {transitions.map((t) => {
            const target = stateMap.get(t.to);
            return (
              <button
                key={t.id}
                onClick={() => onFireTransition(t)}
                className="flex items-center gap-1.5 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 py-2 text-[11px] font-medium text-foreground shadow-[0_0_15px_rgba(110,86,207,0.15)] transition-colors hover:bg-primary/15"
              >
                <Play className="h-3 w-3 text-primary" />
                <span className="font-mono">{t.trigger}</span>
                {t.guard && (
                  <span className="flex items-center gap-0.5 rounded-lg px-1 py-0.5 text-[9px]" style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "var(--lld-diff-medium)" }}>
                    <CheckCircle2 className="h-2.5 w-2.5" style={{ color: "var(--lld-stereo-enum)" }} />
                    [{t.guard}]
                  </span>
                )}
                <span className="text-foreground-subtle">
                  → {target?.name ?? t.to}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {history.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <History className="h-3 w-3 text-foreground-subtle" />
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            History:
          </span>
          <div className="flex items-center gap-1 overflow-x-auto">
            {history.map((stateId, i) => {
              const s = stateMap.get(stateId);
              return (
                <React.Fragment key={`${stateId}-${i}`}>
                  {i > 0 && <span className="text-[10px] text-foreground-subtle">{"\u2192"}</span>}
                  <span className="rounded-lg bg-elevated/50 backdrop-blur-sm border border-border/30 px-1.5 py-0.5 text-[10px] font-medium text-foreground-muted whitespace-nowrap">
                    {s?.name ?? stateId}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
