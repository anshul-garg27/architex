"use client";

/**
 * State Machine Canvas — SVG rendering with simulation support.
 * Split from LLDModule.tsx (LLD-037).
 */

import React, { memo, useMemo, useRef } from "react";
import {
  Circle,
  Play,
  RotateCw,
  X,
  Zap,
  History,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  smStateColor,
  layoutStateMachine,
  smStateCenter,
  smBorderPoint,
  type StateMachineSimState,
} from "../constants";

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

  const positions = useMemo(
    () => (data ? layoutStateMachine(data) : new Map<string, { x: number; y: number }>()),
    [data],
  );

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

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  positions.forEach((pos) => {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + SM_STATE_WIDTH);
    maxY = Math.max(maxY, pos.y + SM_STATE_HEIGHT);
  });
  const pad = CANVAS_VIEWBOX_PAD;
  const vbX = minX - pad;
  const vbY = minY - pad - 30;
  const vbW = maxX - minX + 2 * pad;
  const vbH = maxY - minY + 2 * pad + 30;

  const transitionPairs = new Map<string, StateTransition[]>();
  for (const t of data.transitions) {
    const key = `${t.from}->${t.to}`;
    if (!transitionPairs.has(key)) transitionPairs.set(key, []);
    transitionPairs.get(key)!.push(t);
  }

  return (
    <div className="flex h-full flex-col">
      {title && (
        <div className="flex items-center gap-2 border-b border-border/30 bg-elevated/50 backdrop-blur-sm px-4 py-2">
          <Circle className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            {title}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-blue-400" />
              <span className="text-[10px] text-foreground-subtle">Initial</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full border border-green-400" style={{ borderWidth: 2 }} />
              <span className="text-[10px] text-foreground-subtle">Final</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-gray-500" />
              <span className="text-[10px] text-foreground-subtle">State</span>
            </div>
          </div>
        </div>
      )}
      <div className="relative flex-1 overflow-hidden bg-background">
        <svg
          ref={smSvgRef}
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          className="h-full w-full"
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
          </defs>

          <g transform={smZoomTransform} style={{ transformOrigin: "0 0" }}>
          {/* Transitions */}
          {data.transitions.map((t) => {
            const fromPos = positions.get(t.from);
            const toPos = positions.get(t.to);
            if (!fromPos || !toPos) return null;

            const fromC = smStateCenter(fromPos);
            const toC = smStateCenter(toPos);

            if (t.from === t.to) {
              const cx = fromPos.x + SM_STATE_WIDTH / 2;
              const topY = fromPos.y;
              const loopR = 24;
              return (
                <g key={t.id}>
                  <path
                    d={`M ${cx - 12} ${topY} C ${cx - 12} ${topY - loopR * 2}, ${cx + 12} ${topY - loopR * 2}, ${cx + 12} ${topY}`}
                    fill="none"
                    stroke="var(--lld-canvas-edge)"
                    strokeWidth="1.5"
                    markerEnd="url(#sm-arrow)"
                  />
                  <text
                    x={cx}
                    y={topY - loopR * 2 + 4}
                    textAnchor="middle"
                    className="text-[11px]"
                    fill="var(--lld-canvas-edge)"
                  >
                    {t.trigger}
                    {t.guard ? ` [${t.guard}]` : ""}
                  </text>
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
              <g key={t.id}>
                <path
                  d={pathD}
                  fill="none"
                  stroke="var(--lld-canvas-edge)"
                  strokeWidth="1.5"
                  markerEnd="url(#sm-arrow)"
                />
                <rect
                  x={labelX - label.length * 2.8}
                  y={labelY - 14}
                  width={label.length * 5.6}
                  height={14}
                  rx="3"
                  fill="var(--lld-canvas-bg)"
                  opacity="0.85"
                />
                <text
                  x={labelX}
                  y={labelY - 4}
                  textAnchor="middle"
                  className="text-[11px]"
                  fill="var(--lld-canvas-edge)"
                >
                  {label}
                </text>
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

            return (
              <g
                key={state.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectState(state.id);
                }}
                style={{ cursor: "pointer", opacity: simOpacity, transition: "opacity 0.3s ease" }}
                filter={(isSelected || isSimCurrent) ? "url(#sm-glow)" : undefined}
              >
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
                  fillOpacity={isSimCurrent ? 0.2 : 0.07}
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
                  <span className="flex items-center gap-0.5 rounded-lg bg-amber-500/15 px-1 py-0.5 text-[9px] text-amber-400">
                    <CheckCircle2 className="h-2.5 w-2.5 text-green-400" />
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
