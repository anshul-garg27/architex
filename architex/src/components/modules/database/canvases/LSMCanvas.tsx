"use client";

import React, { memo, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { LSMVizState, LSMVizStep } from "@/lib/database";
import { useInactivityPrompt } from "@/hooks/useInactivityPrompt";
import InactivityNudge from "@/components/shared/InactivityNudge";

// ── Animation constants (from database-visual-language.md) ──

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const DURATION_ENTRY = "200ms";
const DURATION_QUICK = "100ms";
const DURATION_MOVEMENT = "300ms";

// ── Types ────────────────────────────────────────────────────

interface LSMCanvasProps {
  state: LSMVizState;
  steps: LSMVizStep[];
  stepIndex: number;
  onLoadSample?: () => void;
}

// ── Component ────────────────────────────────────────────────

/** Collect SSTable IDs from state for tracking new SSTables. */
function collectSstIds(st: LSMVizState): Set<string> {
  const ids = new Set<string>();
  for (const level of st.levels) {
    for (const sst of level.sstables) {
      ids.add(sst.id);
    }
  }
  return ids;
}

const LSMCanvas = memo(function LSMCanvas({
  state,
  steps,
  stepIndex,
  onLoadSample,
}: LSMCanvasProps) {
  // Track known SSTable IDs for fade-in animation on new SSTables
  const prevSstIdsRef = useRef<Set<string>>(new Set());
  const currentSstIds = useMemo(() => collectSstIds(state), [state]);
  const knownSstIds = prevSstIdsRef.current;

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      prevSstIdsRef.current = new Set(currentSstIds);
    });
    return () => cancelAnimationFrame(raf);
  }, [currentSstIds]);

  const isEmpty = state.memtable.length === 0
    && !state.immutableMemtable
    && state.levels.every((l) => l.sstables.length === 0)
    && steps.length === 0;

  const { showPrompt: showInactivityPrompt, dismiss: dismissInactivity } =
    useInactivityPrompt("lsm-tree", isEmpty);

  if (isEmpty) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-b from-elevated/80 to-background">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
              <rect x="3" y="3" width="18" height="5" rx="1.5" />
              <rect x="3" y="10" width="18" height="5" rx="1.5" />
              <rect x="3" y="17" width="18" height="5" rx="1.5" />
              <path d="M12 8v2M12 15v2" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mb-2 text-sm font-medium text-foreground">
            Cassandra writes 1 million rows per second. This is how.
          </p>
          <p className="mb-4 text-xs text-foreground-muted">
            Write to memtable, flush to SSTables, then compact across levels.
          </p>
          {onLoadSample && (
            <button
              onClick={onLoadSample}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Write sample data
            </button>
          )}
        </div>
        <InactivityNudge
          show={showInactivityPrompt}
          onDismiss={dismissInactivity}
          message="Not sure where to start? Try inserting 42"
        />
      </div>
    );
  }

  const currentStep = steps[stepIndex] as LSMVizStep | undefined;
  const displayState = currentStep?.state ?? state;

  const BOX_W = 140;
  const BOX_H = 60;
  const SST_W = 100;
  const SST_H = 48;
  const GAP_Y = 90;
  const START_Y = 30;
  const LABEL_X = 20;
  const CONTENT_X = 160;
  // WAL panel sits to the right of the main visualization
  const WAL_X = 500;
  const WAL_W = 170;

  const totalLevels = displayState.levels.length;
  // Extra row for WAL panel at top
  const svgHeight = START_Y + (4 + totalLevels) * GAP_Y + 40;

  // Bloom filter state from current step
  const bloomSkipped = currentStep?.bloomSkipped ?? [];
  const bloomChecked = currentStep?.bloomChecked ?? [];
  const isWalActive = currentStep?.walActive ?? false;

  /** Render keys inside a box as comma-separated. */
  function keysLabel(keys: string[]): string {
    if (keys.length === 0) return "(empty)";
    if (keys.length <= 4) return keys.join(", ");
    return `${keys.slice(0, 3).join(", ")}... +${keys.length - 3}`;
  }

  function levelColor(level: number, isHighlight: boolean): string {
    if (isHighlight) return "fill-primary/20 stroke-primary";
    const colors = [
      "fill-emerald-900/20 stroke-emerald-500/60",
      "fill-blue-900/20 stroke-blue-500/60",
      "fill-violet-900/20 stroke-violet-500/60",
    ];
    return colors[level % colors.length];
  }

  /** Get bloom filter indicator for an SSTable during reads. */
  function bloomIndicator(sstId: string): "skipped" | "checked" | null {
    if (bloomSkipped.includes(sstId)) return "skipped";
    if (bloomChecked.includes(sstId)) return "checked";
    return null;
  }

  const highlightLevel = currentStep?.highlightLevel;

  let row = 0;

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-elevated/80 to-background">
      {/* Legend */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border/20 bg-background/60 backdrop-blur-md text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"/> Write</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"/> Flush</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400"/> Compact</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"/> Read</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"/> WAL</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"/> Bloom</span>
      </div>

      {/* Step description bar — fades in on change */}
      <div aria-live="polite" role="status">
      {currentStep && (
        <div
          key={`step-${stepIndex}`}
          className="flex items-center gap-2 border-b border-border/30 bg-elevated/30 backdrop-blur-sm px-4 py-2"
          style={{
            animation: `lsm-step-fade-in ${DURATION_ENTRY} ${EASE_OUT} both`,
          }}
        >
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
              currentStep.operation === "write"
                ? "border border-green-500/30 bg-green-500/10 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.1)]"
                : currentStep.operation === "flush"
                  ? "border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                  : currentStep.operation === "compact"
                    ? "border border-violet-500/30 bg-violet-500/10 text-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.1)]"
                    : currentStep.operation === "checkpoint"
                      ? "border border-orange-500/30 bg-orange-500/10 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.1)]"
                      : "border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.1)]",
            )}
          >
            {currentStep.operation}
          </span>
          <span className="text-xs text-foreground-muted">
            {currentStep.description}
          </span>
        </div>
      )}
      </div>

      {/* Keyframes for LSM animations */}
      <style>{`
        @keyframes lsm-step-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lsm-green-glow {
          0%   { filter: drop-shadow(0 0 0px rgba(34,197,94,0)); }
          50%  { filter: drop-shadow(0 0 10px rgba(34,197,94,0.5)); }
          100% { filter: drop-shadow(0 0 0px rgba(34,197,94,0)); }
        }
        @keyframes lsm-flow-dash {
          to { stroke-dashoffset: -20; }
        }
        @keyframes lsm-wal-pulse {
          0%   { fill-opacity: 0.15; }
          50%  { fill-opacity: 0.4; }
          100% { fill-opacity: 0.15; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes lsm-step-fade-in { from, to { opacity: 1; transform: none; } }
          @keyframes lsm-green-glow { from, to { filter: none; } }
          @keyframes lsm-flow-dash { from, to { stroke-dashoffset: 0; } }
          @keyframes lsm-wal-pulse { from, to { fill-opacity: 0.15; } }
        }
      `}</style>

      <div className="flex-1 overflow-auto p-4">
        <svg
          role="img"
          aria-label={`LSM-Tree storage visualization with ${totalLevels} levels, WAL, and bloom filters`}
          width="100%"
          height={svgHeight}
          viewBox={`0 0 700 ${svgHeight}`}
          className="mx-auto"
        >
          {/* ── WAL Panel (right side) ── */}
          {(() => {
            const walY = START_Y;
            const walEntries = displayState.wal;
            const walH = Math.max(60, 28 + walEntries.length * 16);
            return (
              <g>
                <text
                  x={WAL_X}
                  y={walY - 8}
                  className="fill-orange-400 text-[11px] font-semibold"
                >
                  Write-Ahead Log (WAL)
                </text>
                <rect
                  x={WAL_X}
                  y={walY}
                  width={WAL_W}
                  height={walH}
                  rx={8}
                  className={cn(
                    "stroke-[1.5]",
                    isWalActive
                      ? "stroke-orange-500"
                      : "stroke-orange-700/40",
                  )}
                  style={{
                    fill: 'rgb(154 52 18 / 0.15)',
                    ...(isWalActive ? { animation: 'lsm-wal-pulse 800ms ease-in-out infinite' } : {}),
                    transition: `stroke ${DURATION_ENTRY} ${EASE_OUT}`,
                  }}
                />
                {walEntries.length === 0 ? (
                  <text
                    x={WAL_X + WAL_W / 2}
                    y={walY + walH / 2 + 4}
                    textAnchor="middle"
                    className="fill-foreground-subtle text-[9px]"
                  >
                    (empty — all flushed)
                  </text>
                ) : (
                  walEntries.map((entry, idx) => (
                    <text
                      key={`wal-${idx}`}
                      x={WAL_X + 10}
                      y={walY + 18 + idx * 16}
                      className="fill-orange-300 text-[9px] font-mono"
                    >
                      {idx + 1}. {entry.length > 20 ? entry.slice(0, 20) + "..." : entry}
                    </text>
                  ))
                )}
                <text
                  x={WAL_X + WAL_W / 2}
                  y={walY + walH + 14}
                  textAnchor="middle"
                  className="fill-foreground-subtle text-[8px]"
                >
                  {walEntries.length} entry/entries
                </text>
              </g>
            );
          })()}

          {/* ── Memtable ── */}
          {(() => {
            const y = START_Y + row * GAP_Y;
            row++;
            const isWriteOp = currentStep?.operation === "write" && !currentStep?.walActive;
            // Green glow on write operation
            const memtableGlowStyle: React.CSSProperties = isWriteOp
              ? { animation: `lsm-green-glow ${DURATION_QUICK} ${EASE_OUT}` }
              : {};
            return (
              <g style={memtableGlowStyle}>
                <text
                  x={LABEL_X}
                  y={y + BOX_H / 2 + 4}
                  className="fill-foreground-muted text-[11px] font-semibold"
                >
                  Memtable
                </text>
                <rect
                  x={CONTENT_X}
                  y={y}
                  width={BOX_W}
                  height={BOX_H}
                  rx={8}
                  className={cn(
                    "stroke-[1.5]",
                    isWriteOp
                      ? "fill-green-900/20 stroke-green-500"
                      : "fill-green-900/10 stroke-green-700/40",
                  )}
                  style={{
                    transition: `fill ${DURATION_ENTRY} ${EASE_OUT}, stroke ${DURATION_ENTRY} ${EASE_OUT}`,
                  }}
                />
                <text
                  x={CONTENT_X + BOX_W / 2}
                  y={y + 24}
                  textAnchor="middle"
                  className="fill-foreground text-[10px] font-mono"
                >
                  {keysLabel(displayState.memtable)}
                </text>
                <text
                  x={CONTENT_X + BOX_W / 2}
                  y={y + 42}
                  textAnchor="middle"
                  className="fill-foreground-subtle text-[9px]"
                >
                  {displayState.memtable.length} entries (sorted)
                </text>
                {/* Flush arrow — animated dash flow during flush operations */}
                <line
                  x1={CONTENT_X + BOX_W / 2}
                  y1={y + BOX_H}
                  x2={CONTENT_X + BOX_W / 2}
                  y2={y + BOX_H + 20}
                  className="stroke-foreground-subtle/40"
                  strokeWidth={1.5}
                  markerEnd="url(#arrowhead)"
                  style={currentStep?.operation === "flush" ? {
                    stroke: 'var(--state-warning, #eab308)',
                    strokeDasharray: '6 4',
                    animation: 'lsm-flow-dash 600ms linear infinite',
                  } : {}}
                />
                <text
                  x={CONTENT_X + BOX_W / 2 + 10}
                  y={y + BOX_H + 14}
                  className="fill-foreground-subtle text-[8px]"
                >
                  flush
                </text>
              </g>
            );
          })()}

          {/* ── Immutable Memtable ── */}
          {(() => {
            const y = START_Y + row * GAP_Y;
            row++;
            const isFlushOp = currentStep?.operation === "flush";
            return (
              <g style={{
                transition: `opacity ${DURATION_ENTRY} ${EASE_OUT}`,
              }}>
                <text
                  x={LABEL_X}
                  y={y + BOX_H / 2 + 4}
                  className="fill-foreground-muted text-[11px] font-semibold"
                >
                  Immutable
                </text>
                <rect
                  x={CONTENT_X}
                  y={y}
                  width={BOX_W}
                  height={BOX_H}
                  rx={8}
                  className={cn(
                    "stroke-[1.5]",
                    displayState.immutableMemtable
                      ? "fill-amber-900/20 stroke-amber-500"
                      : "fill-neutral-900/20 stroke-neutral-700/30",
                  )}
                  strokeDasharray={displayState.immutableMemtable ? "none" : "4 3"}
                  style={{
                    transition: `fill ${DURATION_ENTRY} ${EASE_OUT}, stroke ${DURATION_ENTRY} ${EASE_OUT}`,
                  }}
                />
                <text
                  x={CONTENT_X + BOX_W / 2}
                  y={y + 24}
                  textAnchor="middle"
                  className="fill-foreground text-[10px] font-mono"
                >
                  {displayState.immutableMemtable
                    ? keysLabel(displayState.immutableMemtable)
                    : "(none)"}
                </text>
                <text
                  x={CONTENT_X + BOX_W / 2}
                  y={y + 42}
                  textAnchor="middle"
                  className="fill-foreground-subtle text-[9px]"
                >
                  {displayState.immutableMemtable
                    ? `${displayState.immutableMemtable.length} entries (frozen)`
                    : "awaiting flush"}
                </text>
                {/* Arrow down — animated dash flow during flush */}
                <line
                  x1={CONTENT_X + BOX_W / 2}
                  y1={y + BOX_H}
                  x2={CONTENT_X + BOX_W / 2}
                  y2={y + BOX_H + 20}
                  className="stroke-foreground-subtle/40"
                  strokeWidth={1.5}
                  markerEnd="url(#arrowhead)"
                  style={isFlushOp ? {
                    stroke: 'var(--state-warning, #eab308)',
                    strokeDasharray: '6 4',
                    animation: 'lsm-flow-dash 600ms linear infinite',
                  } : {}}
                />
                <text
                  x={CONTENT_X + BOX_W / 2 + 10}
                  y={y + BOX_H + 14}
                  className="fill-foreground-subtle text-[8px]"
                >
                  write to L0
                </text>
              </g>
            );
          })()}

          {/* ── SSTable Levels ── */}
          {displayState.levels.map((level) => {
            const y = START_Y + (row + level.level) * GAP_Y;
            const isHL = highlightLevel === level.level;
            return (
              <g key={level.level}>
                {/* Level label */}
                <text
                  x={LABEL_X}
                  y={y + SST_H / 2 + 4}
                  className="fill-foreground-muted text-[11px] font-semibold"
                >
                  Level {level.level}
                </text>

                {level.sstables.length === 0 ? (
                  <rect
                    x={CONTENT_X}
                    y={y}
                    width={SST_W}
                    height={SST_H}
                    rx={6}
                    className="fill-neutral-900/10 stroke-neutral-700/20 stroke-[1]"
                    strokeDasharray="4 3"
                  />
                ) : (
                  level.sstables.map((sst, idx) => {
                    const sx = CONTENT_X + idx * (SST_W + 12);
                    const isNewSst = !knownSstIds.has(sst.id);
                    const bloomStatus = bloomIndicator(sst.id);
                    return (
                      <g
                        key={sst.id}
                        style={{
                          opacity: isNewSst ? 0 : 1,
                          filter: isHL ? 'drop-shadow(0 0 6px rgba(59,130,246,0.35))' : 'none',
                          transition: `opacity ${DURATION_MOVEMENT} ${EASE_OUT}, filter ${DURATION_ENTRY} ${EASE_OUT}`,
                        }}
                      >
                        <rect
                          x={sx}
                          y={y}
                          width={SST_W}
                          height={SST_H}
                          rx={6}
                          className={cn(
                            "stroke-[1.5]",
                            bloomStatus === "skipped"
                              ? "fill-red-900/15 stroke-red-500/60"
                              : bloomStatus === "checked"
                                ? "fill-cyan-900/15 stroke-cyan-500/60"
                                : levelColor(level.level, isHL),
                          )}
                          style={{
                            transition: `fill ${DURATION_ENTRY} ${EASE_OUT}, stroke ${DURATION_ENTRY} ${EASE_OUT}`,
                          }}
                        />
                        <text
                          x={sx + SST_W / 2}
                          y={y + 16}
                          textAnchor="middle"
                          className="fill-foreground-muted text-[8px] font-semibold"
                        >
                          {sst.id}
                        </text>
                        <text
                          x={sx + SST_W / 2}
                          y={y + 30}
                          textAnchor="middle"
                          className="fill-foreground text-[9px] font-mono"
                        >
                          {keysLabel(sst.keys)}
                        </text>
                        <text
                          x={sx + SST_W / 2}
                          y={y + 42}
                          textAnchor="middle"
                          className="fill-foreground-subtle text-[8px]"
                        >
                          {sst.sizeKB}KB
                        </text>
                        {/* Bloom filter indicator */}
                        {bloomStatus === "skipped" && (
                          <g>
                            {/* Red X — bloom says NOT here */}
                            <circle cx={sx + SST_W - 8} cy={y + 8} r={7} className="fill-red-900/60 stroke-red-500" strokeWidth={1} />
                            <text x={sx + SST_W - 8} y={y + 12} textAnchor="middle" className="fill-red-300 text-[9px] font-bold">
                              X
                            </text>
                          </g>
                        )}
                        {bloomStatus === "checked" && (
                          <g>
                            {/* Green checkmark — bloom says MAYBE here */}
                            <circle cx={sx + SST_W - 8} cy={y + 8} r={7} className="fill-cyan-900/60 stroke-cyan-500" strokeWidth={1} />
                            <text x={sx + SST_W - 8} y={y + 12} textAnchor="middle" className="fill-cyan-300 text-[8px] font-bold">
                              ?
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })
                )}

                {/* Arrow to next level — animated flow during compact */}
                {level.level < totalLevels - 1 && (
                  <g>
                    <line
                      x1={CONTENT_X + (Math.max(level.sstables.length, 1) * (SST_W + 12)) / 2}
                      y1={y + SST_H}
                      x2={CONTENT_X + (Math.max(level.sstables.length, 1) * (SST_W + 12)) / 2}
                      y2={y + SST_H + 30}
                      className="stroke-foreground-subtle/30"
                      strokeWidth={1.5}
                      markerEnd="url(#arrowhead)"
                      style={currentStep?.operation === "compact" && isHL ? {
                        stroke: 'var(--state-processing, #8b5cf6)',
                        strokeDasharray: '6 4',
                        animation: 'lsm-flow-dash 600ms linear infinite',
                      } : {}}
                    />
                    <text
                      x={CONTENT_X + (Math.max(level.sstables.length, 1) * (SST_W + 12)) / 2 + 10}
                      y={y + SST_H + 20}
                      className="fill-foreground-subtle text-[8px]"
                    >
                      compact
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <path
                d="M0,0 L8,3 L0,6"
                className="fill-none stroke-foreground-subtle/60"
                strokeWidth={1}
              />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  );
});

export default LSMCanvas;
