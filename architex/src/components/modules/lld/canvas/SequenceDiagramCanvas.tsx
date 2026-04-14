"use client";

/**
 * Sequence Diagram Canvas — SVG rendering with playback support.
 * Split from LLDModule.tsx (LLD-037).
 */

import React, { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  GitBranch,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SequenceMessage, SequenceDiagramData } from "@/lib/lld";
import { useSVGZoomPan, ZoomToolbar } from "./LLDCanvas";
import {
  SEQ_PARTICIPANT_WIDTH,
  SEQ_PARTICIPANT_HEIGHT,
  SEQ_PARTICIPANT_GAP,
  SEQ_MESSAGE_ROW_HEIGHT,
  SEQ_TOP_MARGIN,
  SEQ_LIFELINE_START,
  SEQ_ACTIVATION_WIDTH,
  SEQ_TYPE_COLORS,
  CANVAS_GRID_SIZE,
  type SequencePlaybackState,
} from "../constants";

// ── Sequence Diagram Canvas ──────────────────────────────

interface SequenceDiagramCanvasProps {
  data: SequenceDiagramData | null;
  title: string | null;
  selectedMessageId: string | null;
  onSelectMessage: (id: string | null) => void;
  playbackStep: number | null;
}

export const SequenceDiagramCanvas = memo(function SequenceDiagramCanvas({
  data,
  title,
  selectedMessageId,
  onSelectMessage,
  playbackStep,
}: SequenceDiagramCanvasProps) {
  const seqSvgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    svgTransform: seqZoomTransform,
    zoomPercent: seqZoomPercent,
    handlePanStart: seqHandlePanStart,
    handlePanMove: seqHandlePanMove,
    handlePanEnd: seqHandlePanEnd,
    zoomIn: seqZoomIn,
    zoomOut: seqZoomOut,
    zoomReset: seqZoomReset,
    zoomFit: seqZoomFit,
  } = useSVGZoomPan(seqSvgRef);

  // (#5) Participant hover state — tracks which participant header is hovered
  const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null);

  // (#7) Message hover tooltip
  const [tooltipMsg, setTooltipMsg] = useState<{
    msg: SequenceMessage;
    x: number;
    y: number;
  } | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // (#1) Track container size with ResizeObserver for auto-fit
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

  // (#1) Auto-fit when sequence data or container size changes
  const messagesKey = useMemo(
    () => data?.messages.map((m) => m.id).join(",") ?? "",
    [data?.messages],
  );
  useEffect(() => {
    if (data && data.messages.length > 0) seqZoomFit();
  }, [messagesKey, containerSize.width, containerSize.height]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBgClick = useCallback(() => {
    onSelectMessage(null);
  }, [onSelectMessage]);

  // (#7) Tooltip show/hide helpers
  const showTooltip = useCallback((msg: SequenceMessage, clientX: number, clientY: number) => {
    if (!msg.narration) return;
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setTooltipMsg({ msg, x: clientX - rect.left, y: clientY - rect.top });
    }, 400);
  }, []);

  const hideTooltip = useCallback(() => {
    if (tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
      tooltipTimer.current = null;
    }
    setTooltipMsg(null);
  }, []);

  if (!data || data.participants.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="text-center">
          <GitBranch className="mx-auto mb-3 h-16 w-16 text-foreground-subtle opacity-20" />
          <p className="text-sm text-foreground-muted">
            Select a sequence diagram from the sidebar.
          </p>
        </div>
      </div>
    );
  }

  const sortedMessages = [...data.messages].sort((a, b) => a.order - b.order);
  const participantX = (idx: number) => 60 + idx * SEQ_PARTICIPANT_GAP;
  const participantCenterX = (idx: number) =>
    participantX(idx) + SEQ_PARTICIPANT_WIDTH / 2;

  const pIndex = new Map<string, number>();
  data.participants.forEach((p, i) => pIndex.set(p.id, i));

  const computedWidth =
    60 + data.participants.length * SEQ_PARTICIPANT_GAP + 60;
  const computedHeight =
    SEQ_LIFELINE_START +
    sortedMessages.length * SEQ_MESSAGE_ROW_HEIGHT +
    80;

  // (#10) ViewBox minimum dimensions — prevent over-zoom on small sequences
  const MIN_W = 800;
  const MIN_H = 500;
  const totalWidth = Math.max(computedWidth, MIN_W);
  const totalHeight = Math.max(computedHeight, MIN_H);

  // Center content within (possibly larger) viewBox
  const contentCX = computedWidth / 2;
  const contentCY = computedHeight / 2;
  const vbX = contentCX - totalWidth / 2;
  const vbY = contentCY - totalHeight / 2;

  const activations: Array<{
    participantIdx: number;
    startRow: number;
    endRow: number;
  }> = [];

  const activeStack: Map<string, number[]> = new Map();
  for (const msg of sortedMessages) {
    const rowIdx = msg.order - 1;
    if (msg.type === "sync" && msg.from !== msg.to) {
      if (!activeStack.has(msg.to)) activeStack.set(msg.to, []);
      activeStack.get(msg.to)!.push(rowIdx);
    } else if (msg.type === "return" && msg.from !== msg.to) {
      const stack = activeStack.get(msg.from);
      if (stack && stack.length > 0) {
        const startRow = stack.pop()!;
        const pidx = pIndex.get(msg.from);
        if (pidx !== undefined) {
          activations.push({
            participantIdx: pidx,
            startRow,
            endRow: rowIdx,
          });
        }
      }
    }
  }
  activeStack.forEach((stack, pid) => {
    const pidx = pIndex.get(pid);
    if (pidx !== undefined) {
      for (const startRow of stack) {
        activations.push({
          participantIdx: pidx,
          startRow,
          endRow: sortedMessages.length - 1,
        });
      }
    }
  });

  const messageY = (orderIdx: number) =>
    SEQ_LIFELINE_START + orderIdx * SEQ_MESSAGE_ROW_HEIGHT + 25;

  // (#5) Helper: is a message related to the hovered participant?
  const isRelatedToHovered = (msg: SequenceMessage) => {
    if (!hoveredParticipant) return true;
    return msg.from === hoveredParticipant || msg.to === hoveredParticipant;
  };

  const gridSize = CANVAS_GRID_SIZE;

  return (
    <div className="flex h-full flex-col">
      {title && (
        <div className="flex items-center gap-2 border-b border-border/30 bg-elevated/50 backdrop-blur-sm px-4 py-2">
          <GitBranch className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            {title}
          </span>
          <div className="ml-auto flex items-center gap-3">
            {(["sync", "async", "return", "self"] as const).map((t) => (
              <div key={t} className="flex items-center gap-1">
                <div
                  className="h-0.5 w-4 rounded-lg"
                  style={{
                    backgroundColor: SEQ_TYPE_COLORS[t],
                    ...(t === "return"
                      ? { backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 2px, var(--lld-canvas-bg) 2px, var(--lld-canvas-bg) 4px)" }
                      : {}),
                  }}
                />
                <span className="text-[10px] text-foreground-subtle capitalize">
                  {t}
                </span>
              </div>
            ))}
            {/* (#9) Compact zoom controls in header bar */}
            <div className="mx-0.5 h-4 w-px bg-border/30" />
            <div className="flex items-center gap-1 rounded-lg border border-border/30 bg-background/60 px-1.5 py-0.5">
              <button onClick={seqZoomOut} className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold text-foreground-muted hover:bg-accent hover:text-foreground" title="Zoom out" aria-label="Zoom out">&minus;</button>
              <span className="min-w-[2.5rem] text-center text-[10px] font-semibold text-foreground-subtle">{seqZoomPercent}%</span>
              <button onClick={seqZoomIn} className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold text-foreground-muted hover:bg-accent hover:text-foreground" title="Zoom in" aria-label="Zoom in">+</button>
              <div className="mx-0.5 h-3 w-px bg-border/30" />
              <button onClick={() => seqZoomFit()} className="rounded px-2 py-0.5 text-[10px] font-semibold text-foreground-muted hover:bg-accent hover:text-foreground" title="Fit to view" aria-label="Fit to view">Fit</button>
              <button onClick={seqZoomReset} className="rounded px-2 py-0.5 text-[10px] font-semibold text-foreground-muted hover:bg-accent hover:text-foreground" title="Reset to 100%" aria-label="Reset to 100%">100%</button>
            </div>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-background"
        onClick={handleBgClick}
      >
        <svg
          ref={seqSvgRef}
          viewBox={`${vbX} ${vbY} ${totalWidth} ${totalHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
          style={{ minHeight: 400 }}
          onPointerDown={seqHandlePanStart}
          onPointerMove={seqHandlePanMove}
          onPointerUp={seqHandlePanEnd}
        >
          <defs>
            {/* (#3) Dot grid — Figma-style, matching LLDCanvas */}
            <pattern id="seq-grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
              <circle
                cx={gridSize / 2}
                cy={gridSize / 2}
                r="1"
                fill="var(--lld-canvas-text-subtle)"
                opacity="0.18"
              />
            </pattern>
            {/* (#4) Radial vignette — lighter center, darker edges for depth */}
            <radialGradient id="seq-vignette" cx="50%" cy="50%" r="75%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="var(--lld-canvas-bg)" stopOpacity="0" />
              <stop offset="80%" stopColor="var(--lld-canvas-bg)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--lld-canvas-bg-deep)" stopOpacity="0.2" />
            </radialGradient>
            {/* Glassmorphism glow filter for active/selected messages */}
            <filter id="seq-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            {/* Subtle gradient fill for participant boxes */}
            <linearGradient id="seq-participant-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--lld-canvas-bg)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--lld-canvas-bg)" stopOpacity="0.7" />
            </linearGradient>
            <marker
              id="seq-arrow-sync"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 Z" fill="var(--lld-seq-sync)" />
            </marker>
            <marker
              id="seq-arrow-async"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="var(--lld-seq-async)" strokeWidth="1.5" />
            </marker>
            <marker
              id="seq-arrow-return"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="var(--lld-seq-return)" strokeWidth="1.5" />
            </marker>
          </defs>
          <rect x={vbX} y={vbY} width={totalWidth} height={totalHeight} fill="url(#seq-grid)" />
          {/* (#4) Vignette overlay */}
          <rect x={vbX} y={vbY} width={totalWidth} height={totalHeight} fill="url(#seq-vignette)" pointerEvents="none" />

          <g transform={seqZoomTransform} style={{ transformOrigin: "0 0" }}>

          {/* Participants (top boxes) */}
          {data.participants.map((p, i) => {
            const x = participantX(i);
            const isActor = p.type === "actor";
            const isHovered = hoveredParticipant === p.id;
            return (
              <g
                key={p.id}
                onPointerEnter={() => setHoveredParticipant(p.id)}
                onPointerLeave={() => setHoveredParticipant(null)}
                style={{ cursor: "pointer" }}
              >
                {/* (#5) Highlight ring when hovered */}
                {isHovered && (
                  <rect
                    x={x - 3}
                    y={SEQ_TOP_MARGIN - 3}
                    width={SEQ_PARTICIPANT_WIDTH + 6}
                    height={SEQ_PARTICIPANT_HEIGHT + 6}
                    rx={10}
                    fill="none"
                    stroke="var(--lld-canvas-selected)"
                    strokeWidth="1.5"
                    opacity="0.5"
                  />
                )}
                <rect
                  x={x}
                  y={SEQ_TOP_MARGIN}
                  width={SEQ_PARTICIPANT_WIDTH}
                  height={SEQ_PARTICIPANT_HEIGHT}
                  rx={8}
                  fill={isActor ? "var(--lld-canvas-actor-bg)" : "url(#seq-participant-gradient)"}
                  stroke={isActor ? "var(--lld-stereo-interface)" : "var(--lld-canvas-border)"}
                  strokeWidth={1.5}
                  strokeOpacity={isHovered ? 0.6 : 0.3}
                />
                {isActor && (
                  <text
                    x={x + SEQ_PARTICIPANT_WIDTH / 2}
                    y={SEQ_TOP_MARGIN - 4}
                    textAnchor="middle"
                    fill="var(--lld-stereo-interface)"
                    fontSize="12"
                  >
                    &#x1D5D4;
                  </text>
                )}
                <text
                  x={x + SEQ_PARTICIPANT_WIDTH / 2}
                  y={SEQ_TOP_MARGIN + SEQ_PARTICIPANT_HEIGHT / 2 + 4}
                  textAnchor="middle"
                  fill="var(--lld-canvas-text)"
                  fontSize="12"
                  fontWeight="600"
                >
                  {p.name}
                </text>

                <line
                  x1={participantCenterX(i)}
                  y1={SEQ_TOP_MARGIN + SEQ_PARTICIPANT_HEIGHT}
                  x2={participantCenterX(i)}
                  y2={totalHeight - 20}
                  stroke="var(--lld-canvas-lifeline)"
                  strokeWidth="1"
                  strokeDasharray="6 4"
                />
              </g>
            );
          })}

          {/* Activation boxes */}
          {activations.map((act, i) => {
            const cx = participantCenterX(act.participantIdx);
            const startY = messageY(act.startRow) - 10;
            const endY = messageY(act.endRow) + 10;
            return (
              <rect
                key={`act-${i}`}
                x={cx - SEQ_ACTIVATION_WIDTH / 2}
                y={startY}
                width={SEQ_ACTIVATION_WIDTH}
                height={endY - startY}
                rx={2}
                fill="var(--lld-canvas-activation)"
                stroke="var(--lld-canvas-selected)"
                strokeWidth="1"
                opacity="0.6"
              />
            );
          })}

          {/* Messages */}
          {sortedMessages.map((msg, msgIdx) => {
            const stepIndex = msgIdx + 1;
            if (playbackStep !== null && stepIndex > playbackStep) return null;

            const fromIdx = pIndex.get(msg.from) ?? 0;
            const toIdx = pIndex.get(msg.to) ?? 0;
            const y = messageY(msg.order - 1);
            const isSelected = selectedMessageId === msg.id;
            const isCurrent = playbackStep !== null && stepIndex === playbackStep;
            const color = SEQ_TYPE_COLORS[msg.type];

            const strokeW = isCurrent ? 3 : isSelected ? 2.5 : 1.5;
            // (#5) Dim non-related messages when a participant is hovered
            const related = isRelatedToHovered(msg);
            const hoverDim = hoveredParticipant && !related ? 0.35 : 1;
            const msgOpacity = isCurrent ? 1 : (playbackStep !== null ? 0.7 : hoverDim);

            if (msg.type === "self" || msg.from === msg.to) {
              const cx = participantCenterX(fromIdx);
              const loopW = 40;
              const loopH = 20;
              // (#6) Compute polyline total length for draw animation
              const selfPathLen = loopW + loopH + loopW; // 3 segments of the U-shape
              return (
                <g
                  key={msg.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMessage(msg.id);
                  }}
                  onPointerEnter={(e) => showTooltip(msg, e.clientX, e.clientY)}
                  onPointerLeave={hideTooltip}
                  style={{ cursor: "pointer", opacity: msgOpacity }}
                  filter={(isSelected || isCurrent) ? "url(#seq-glow)" : undefined}
                >
                  {isCurrent && (
                    <polyline
                      points={`${cx + SEQ_ACTIVATION_WIDTH / 2},${y - loopH / 2} ${cx + loopW},${y - loopH / 2} ${cx + loopW},${y + loopH / 2} ${cx + SEQ_ACTIVATION_WIDTH / 2},${y + loopH / 2}`}
                      fill="none"
                      stroke={color}
                      strokeWidth={6}
                      opacity={0.2}
                    />
                  )}
                  {isSelected && (
                    <rect
                      x={cx - 4}
                      y={y - loopH - 4}
                      width={loopW + 12}
                      height={loopH + 24}
                      rx={4}
                      fill="var(--lld-canvas-selected)"
                      opacity="0.08"
                    />
                  )}
                  <polyline
                    points={`${cx + SEQ_ACTIVATION_WIDTH / 2},${y - loopH / 2} ${cx + loopW},${y - loopH / 2} ${cx + loopW},${y + loopH / 2} ${cx + SEQ_ACTIVATION_WIDTH / 2},${y + loopH / 2}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeW}
                    strokeDasharray={isCurrent ? `${selfPathLen}` : undefined}
                    strokeDashoffset={isCurrent ? `${selfPathLen}` : undefined}
                  >
                    {isCurrent && (
                      <animate
                        attributeName="stroke-dashoffset"
                        from={`${selfPathLen}`}
                        to="0"
                        dur="0.2s"
                        fill="freeze"
                        begin="0s"
                      />
                    )}
                  </polyline>
                  <polygon
                    points={`${cx + SEQ_ACTIVATION_WIDTH / 2},${y + loopH / 2} ${cx + SEQ_ACTIVATION_WIDTH / 2 + 8},${y + loopH / 2 - 4} ${cx + SEQ_ACTIVATION_WIDTH / 2 + 8},${y + loopH / 2 + 4}`}
                    fill={color}
                  />
                  <text
                    x={cx + loopW + 6}
                    y={y + 4}
                    fill={isCurrent || isSelected ? "var(--lld-canvas-text)" : "var(--lld-canvas-text-muted)"}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight={isCurrent ? "bold" : "normal"}
                  >
                    {msg.label}
                  </text>
                </g>
              );
            }

            const fromX = participantCenterX(fromIdx);
            const toX = participantCenterX(toIdx);
            const goingRight = toX > fromX;
            const x1 = goingRight
              ? fromX + SEQ_ACTIVATION_WIDTH / 2
              : fromX - SEQ_ACTIVATION_WIDTH / 2;
            const x2 = goingRight
              ? toX - SEQ_ACTIVATION_WIDTH / 2
              : toX + SEQ_ACTIVATION_WIDTH / 2;

            const isDashed = msg.type === "return";
            const markerUrl =
              msg.type === "sync"
                ? "url(#seq-arrow-sync)"
                : msg.type === "async"
                  ? "url(#seq-arrow-async)"
                  : "url(#seq-arrow-return)";

            const labelX = (x1 + x2) / 2;
            const labelY = y - 8;

            const lineLen = Math.abs(x2 - x1);

            return (
              <g
                key={msg.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMessage(msg.id);
                }}
                onPointerEnter={(e) => showTooltip(msg, e.clientX, e.clientY)}
                onPointerLeave={hideTooltip}
                style={{ cursor: "pointer", opacity: msgOpacity }}
                filter={(isSelected || isCurrent) ? "url(#seq-glow)" : undefined}
              >
                {isCurrent && (
                  <line
                    x1={x1}
                    y1={y}
                    x2={x2}
                    y2={y}
                    stroke={color}
                    strokeWidth={6}
                    opacity={0.2}
                  />
                )}
                {isSelected && (
                  <rect
                    x={Math.min(x1, x2) - 4}
                    y={y - 20}
                    width={Math.abs(x2 - x1) + 8}
                    height={30}
                    rx={4}
                    fill="var(--lld-canvas-selected)"
                    opacity="0.08"
                  />
                )}
                {/* (#6) Fixed draw animation — dasharray/dashoffset from lineLen to 0 */}
                <line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke={color}
                  strokeWidth={strokeW}
                  strokeDasharray={isDashed ? "6 4" : (isCurrent ? `${lineLen}` : undefined)}
                  strokeDashoffset={isCurrent && !isDashed ? `${lineLen}` : undefined}
                  markerEnd={markerUrl}
                >
                  {isCurrent && !isDashed && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from={`${lineLen}`}
                      to="0"
                      dur="0.2s"
                      fill="freeze"
                    />
                  )}
                </line>
                <text
                  x={Math.min(x1, x2) - 16}
                  y={y + 4}
                  textAnchor="end"
                  fill="var(--lld-canvas-border)"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {msg.order}
                </text>
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  fill={isCurrent || isSelected ? "var(--lld-canvas-text)" : "var(--lld-canvas-text-muted)"}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight={isCurrent ? "bold" : "normal"}
                >
                  {msg.label}
                </text>
              </g>
            );
          })}
          </g>
        </svg>

        {/* (#7) Message hover tooltip */}
        {tooltipMsg && (
          <div
            className="pointer-events-none absolute z-40 max-w-xs rounded-lg border border-border/30 bg-background/95 backdrop-blur-md px-3 py-2 shadow-xl"
            style={{
              left: Math.min(tooltipMsg.x, (containerSize.width || 600) - 280),
              top: tooltipMsg.y + 16,
            }}
          >
            <p className="text-[11px] font-semibold text-foreground mb-0.5">
              {tooltipMsg.msg.label}
            </p>
            {tooltipMsg.msg.narration && (
              <p className="text-[10px] text-foreground-muted leading-relaxed">
                {tooltipMsg.msg.narration}
              </p>
            )}
          </div>
        )}

        <ZoomToolbar
          zoomPercent={seqZoomPercent}
          onZoomIn={seqZoomIn}
          onZoomOut={seqZoomOut}
          onZoomFit={seqZoomFit}
          onZoomReset={seqZoomReset}
        />
      </div>
    </div>
  );
});

// ── Sequence Playback Toolbar ────────────────────────────

const PLAYBACK_SPEEDS = [0.5, 1, 2] as const;

export const SequencePlaybackToolbar = memo(function SequencePlaybackToolbar({
  state,
  totalMessages,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onReplay,
  onSpeedChange,
  onStop,
}: {
  state: SequencePlaybackState;
  totalMessages: number;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReplay: () => void;
  onSpeedChange: (speed: number) => void;
  onStop: () => void;
}) {
  const isAtEnd = state.currentStep >= totalMessages;

  return (
    <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-xl border border-border/30 backdrop-blur-md bg-background/60 px-2 py-1.5 shadow-lg">
      <button
        onClick={onStepBack}
        disabled={state.currentStep <= 0}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border/50 text-foreground-muted transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
        title="Step back"
        aria-label="Step back"
      >
        <SkipBack className="h-3.5 w-3.5" />
      </button>

      {isAtEnd ? (
        <button
          onClick={onReplay}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-colors hover:bg-primary/90"
          title="Replay"
          aria-label="Replay"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>
      ) : state.playing ? (
        <button
          onClick={onPause}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-colors hover:bg-primary/90"
          title="Pause"
          aria-label="Pause"
        >
          <Pause className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button
          onClick={onPlay}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-colors hover:bg-primary/90"
          title="Play"
          aria-label="Play"
        >
          <Play className="h-3.5 w-3.5" />
        </button>
      )}

      <button
        onClick={onStepForward}
        disabled={isAtEnd}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border/50 text-foreground-muted transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
        title="Step forward"
        aria-label="Step forward"
      >
        <SkipForward className="h-3.5 w-3.5" />
      </button>

      <div className="mx-0.5 h-4 w-px bg-border/30" />

      {PLAYBACK_SPEEDS.map((s) => (
        <button
          key={s}
          onClick={() => onSpeedChange(s)}
          className={cn(
            "rounded-lg px-1.5 py-0.5 text-[10px] font-medium transition-colors",
            state.speed === s
              ? "bg-primary/15 text-primary"
              : "text-foreground-subtle hover:bg-accent hover:text-foreground",
          )}
          title={`Speed ${s}x`}
        >
          {s}x
        </button>
      ))}

      <div className="mx-0.5 h-4 w-px bg-border/30" />

      <span className="text-[10px] font-medium text-foreground-subtle tabular-nums">
        {state.currentStep}/{totalMessages}
      </span>

      <button
        onClick={onStop}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border/50 text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
        title="Exit playback"
        aria-label="Exit playback"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});
