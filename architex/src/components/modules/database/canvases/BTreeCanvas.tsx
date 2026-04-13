"use client";

import React, { memo, useMemo, useRef, useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BTreeNode, BTreeStep } from "@/lib/database";
import { useInactivityPrompt } from "@/hooks/useInactivityPrompt";
import InactivityNudge from "@/components/shared/InactivityNudge";

// ── Animation constants (from database-visual-language.md) ──

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const DURATION_ENTRY = "200ms";
const DURATION_MOVEMENT = "300ms";

// ── Types ────────────────────────────────────────────────────

interface BTreeCanvasProps {
  tree: BTreeNode;
  steps: BTreeStep[];
  stepIndex: number;
  highlightNodeId?: string;
  highlightKey?: number;
  onLoadSample?: () => void;
  // Prediction mode (DBL-129)
  predictionMode?: boolean;
  predictionPaused?: boolean;
  predictionQuestion?: string | null;
  predictionOptions?: Array<{ label: string; childIndex: number }>;
  predictionCorrectIndex?: number;
  predictionSelectedOption?: number | null;
  predictionExplanation?: string;
  predictionScore?: { correct: number; total: number };
  onPredictionSelect?: (childIndex: number) => void;
}

/** Layout information for a single node in the rendered tree. */
export interface BTreeLayout {
  node: BTreeNode;
  x: number;
  y: number;
  width: number;
  children: BTreeLayout[];
}

// ── Layout helpers ───────────────────────────────────────────

export function layoutBTree(
  node: BTreeNode,
  depth: number,
  xOffset: number,
): BTreeLayout {
  const keyW = 36;
  const nodeW = Math.max(node.keys.length * keyW, keyW);
  const nodeH = 34;
  const hGap = 18;
  const vGap = 60;

  if (node.isLeaf || node.children.length === 0) {
    return {
      node,
      x: xOffset,
      y: depth * (nodeH + vGap),
      width: nodeW,
      children: [],
    };
  }

  const childLayouts: BTreeLayout[] = [];
  let cx = xOffset;
  for (const child of node.children) {
    const cl = layoutBTree(child, depth + 1, cx);
    childLayouts.push(cl);
    cx = cl.x + cl.width + hGap;
  }

  const firstChild = childLayouts[0];
  const lastChild = childLayouts[childLayouts.length - 1];
  const totalChildWidth =
    lastChild.x + lastChild.width - firstChild.x;
  const centerX = firstChild.x + totalChildWidth / 2 - nodeW / 2;

  return {
    node,
    x: Math.max(xOffset, centerX),
    y: depth * (nodeH + vGap),
    width: nodeW,
    children: childLayouts,
  };
}

export function getBounds(l: BTreeLayout): {
  maxX: number;
  maxY: number;
} {
  const keyW = 36;
  const nodeH = 34;
  const w = Math.max(l.node.keys.length * keyW, keyW);
  let maxX = l.x + w;
  let maxY = l.y + nodeH;
  for (const c of l.children) {
    const cb = getBounds(c);
    maxX = Math.max(maxX, cb.maxX);
    maxY = Math.max(maxY, cb.maxY);
  }
  return { maxX, maxY };
}

function renderBTreeNode(
  layout: BTreeLayout,
  highlightNodeId?: string,
  highlightKey?: number,
  knownNodeIds?: Set<string>,
  hoveredNodeId?: string | null,
  onHoverNode?: (id: string | null) => void,
): React.ReactNode {
  const keyW = 36;
  const nodeH = 34;
  const isHighlight = layout.node.id === highlightNodeId;
  const isHovered = layout.node.id === hoveredNodeId;
  const nodeW = Math.max(layout.node.keys.length * keyW, keyW);
  const isNew = knownNodeIds ? !knownNodeIds.has(layout.node.id) : false;

  // Transition styles for smooth animation between steps
  const nodeTransition = {
    transition: `opacity ${DURATION_ENTRY} ${EASE_OUT}, filter ${DURATION_ENTRY} ${EASE_OUT}, transform 150ms ease`,
    opacity: isNew ? 0 : 1,
    filter: isHighlight
      ? 'drop-shadow(0 0 8px rgba(59,130,246,0.4))'
      : isHovered
        ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
        : 'none',
    transform: isHovered && !isHighlight ? 'scale(1.02)' : undefined,
    transformOrigin: `${layout.x + nodeW / 2}px ${layout.y + nodeH / 2}px`,
    cursor: 'pointer',
  } as React.CSSProperties;

  const edgeTransition = {
    transition: `stroke ${DURATION_ENTRY} ${EASE_OUT}, stroke-width ${DURATION_ENTRY} ${EASE_OUT}, opacity ${DURATION_ENTRY} ${EASE_OUT}`,
  } as React.CSSProperties;

  return (
    <g
      key={layout.node.id}
      style={nodeTransition}
      onMouseEnter={() => onHoverNode?.(layout.node.id)}
      onMouseLeave={() => onHoverNode?.(null)}
    >
      {/* Lines to children */}
      {layout.children.map((cl) => {
        const childNodeW = Math.max(cl.node.keys.length * keyW, keyW);
        return (
          <line
            key={`edge-${layout.node.id}-${cl.node.id}`}
            x1={layout.x + nodeW / 2}
            y1={layout.y + nodeH}
            x2={cl.x + childNodeW / 2}
            y2={cl.y}
            style={{ ...edgeTransition, stroke: isHighlight ? 'var(--primary)' : 'var(--foreground-subtle)' }}
            strokeWidth={isHighlight ? 2 : 1}
          />
        );
      })}

      {/* Arrow marker for highlighted node (non-color encoding) */}
      {isHighlight && (
        <text
          x={layout.x - 14}
          y={layout.y + nodeH / 2 + 5}
          style={{ fill: 'var(--primary)', transition: `opacity ${DURATION_ENTRY} ${EASE_OUT}` }}
          fontSize="16"
          fontWeight="bold"
          aria-label="Current node"
        >
          {"\u25B6"}
        </text>
      )}

      {/* Node box */}
      <rect
        x={layout.x}
        y={layout.y}
        width={nodeW}
        height={nodeH}
        rx={6}
        style={{
          fill: isHighlight ? 'var(--primary-surface, rgba(59,130,246,0.15))' : 'var(--surface)',
          stroke: isHighlight ? 'var(--primary)' : 'var(--border)',
          transition: `fill ${DURATION_ENTRY} ${EASE_OUT}, stroke ${DURATION_ENTRY} ${EASE_OUT}, stroke-width ${DURATION_ENTRY} ${EASE_OUT}`,
        }}
        strokeWidth={isHighlight ? 2 : 1}
      />

      {/* Keys */}
      {layout.node.keys.map((k, i) => {
        const kx = layout.x + i * keyW + keyW / 2;
        const isKeyHL = isHighlight && k === highlightKey;
        return (
          <g key={`key-${layout.node.id}-${i}`}>
            {/* Key separator */}
            {i > 0 && (
              <line
                x1={layout.x + i * keyW}
                y1={layout.y + 4}
                x2={layout.x + i * keyW}
                y2={layout.y + nodeH - 4}
                style={{ stroke: 'var(--border)' }}
                strokeWidth={1}
              />
            )}
            {/* Highlight circle behind key */}
            {isKeyHL && (
              <circle
                cx={kx}
                cy={layout.y + nodeH / 2}
                r={13}
                style={{
                  fill: 'var(--primary)',
                  transition: `opacity ${DURATION_ENTRY} ${EASE_OUT}`,
                }}
                opacity={0.3}
              />
            )}
            <text
              x={kx}
              y={layout.y + nodeH / 2 + 5}
              textAnchor="middle"
              style={{
                fill: isKeyHL ? 'var(--primary-light, #93c5fd)' : 'var(--foreground)',
                transition: `fill ${DURATION_ENTRY} ${EASE_OUT}`,
              }}
              fontSize="13"
              fontWeight={isKeyHL ? "700" : "500"}
              fontFamily="monospace"
            >
              {k}
            </text>
          </g>
        );
      })}

      {/* Empty node placeholder */}
      {layout.node.keys.length === 0 && (
        <text
          x={layout.x + nodeW / 2}
          y={layout.y + nodeH / 2 + 4}
          textAnchor="middle"
          style={{ fill: 'var(--foreground-subtle)' }}
          fontSize="11"
          fontStyle="italic"
        >
          empty
        </text>
      )}

      {/* Recursively render children */}
      {layout.children.map((cl) =>
        renderBTreeNode(cl, highlightNodeId, highlightKey, knownNodeIds, hoveredNodeId, onHoverNode),
      )}
    </g>
  );
}

// ── Component ────────────────────────────────────────────────

/** Collect all node IDs from a tree recursively. */
function collectNodeIds(node: BTreeNode, set: Set<string>): void {
  set.add(node.id);
  for (const child of node.children) {
    collectNodeIds(child, set);
  }
}

const BTreeCanvas = memo(function BTreeCanvas({
  tree,
  steps,
  stepIndex,
  highlightNodeId,
  highlightKey,
  onLoadSample,
  predictionMode,
  predictionPaused,
  predictionQuestion,
  predictionOptions,
  predictionCorrectIndex,
  predictionSelectedOption,
  predictionExplanation,
  predictionScore,
  onPredictionSelect,
}: BTreeCanvasProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const handleHoverNode = useCallback((id: string | null) => setHoveredNodeId(id), []);

  // Track previously-known node IDs to detect new nodes for fade-in.
  // On each render, "knownNodeIds" is the previous frame's ID set.
  // Nodes in currentNodeIds but NOT in knownNodeIds are new and will start
  // at opacity 0, then transition to 1 on the next frame.
  const prevNodeIdsRef = useRef<Set<string>>(new Set());

  const currentNodeIds = useMemo(() => {
    const ids = new Set<string>();
    collectNodeIds(tree, ids);
    return ids;
  }, [tree]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      prevNodeIdsRef.current = new Set(currentNodeIds);
    });
    return () => cancelAnimationFrame(raf);
  }, [currentNodeIds]);

  const knownNodeIds = prevNodeIdsRef.current;

  const isEmpty = tree.keys.length === 0 && tree.children.length === 0;
  const isFullyEmpty = isEmpty && steps.length === 0;

  const { showPrompt: showInactivityPrompt, dismiss: dismissInactivity } =
    useInactivityPrompt("btree-index", isFullyEmpty);

  if (isFullyEmpty) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-b from-elevated/80 to-background">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
              <rect x="3" y="3" width="7" height="4" rx="1" />
              <rect x="14" y="3" width="7" height="4" rx="1" />
              <rect x="8.5" y="17" width="7" height="4" rx="1" />
              <path d="M6.5 7v4h11V7M12 11v6" />
            </svg>
          </div>
          <p className="mb-2 text-sm font-medium text-foreground">
            How does a database find 1 row in 10 million? Watch a B-Tree do it in 4 steps.
          </p>
          <p className="mb-4 text-xs text-foreground-muted">
            Insert keys to see how the tree self-balances with splits and merges.
          </p>
          {onLoadSample && (
            <button
              onClick={onLoadSample}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Try it: Insert [10, 20, 5, 15, 25, 30]
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

  const nodeCount = currentNodeIds.size;

  const layout = useMemo(() => layoutBTree(tree, 0, 30), [tree]);

  const bounds = getBounds(layout);
  const svgWidth = Math.max(bounds.maxX + 40, 400);
  const svgHeight = Math.max(bounds.maxY + 40, 200);

  const currentStep = steps[stepIndex] as BTreeStep | undefined;

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-gradient-to-b from-elevated/80 to-background">
      {/* Legend */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border/20 bg-background/60 backdrop-blur-md text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"/> Insert</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"/> Split</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"/> Search</span>
      </div>

      {/* Step description bar — fades in on change */}
      <div aria-live="polite" role="status">
      {currentStep && (
        <div
          key={`step-${stepIndex}`}
          className="flex items-center gap-2 border-b border-border/30 bg-elevated/30 backdrop-blur-sm px-4 py-2"
          style={{
            animation: `btree-step-fade-in ${DURATION_ENTRY} ${EASE_OUT} both`,
          }}
        >
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
              currentStep.operation === "insert"
                ? "border border-green-500/30 bg-green-500/10 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.1)]"
                : currentStep.operation === "split"
                  ? "border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                  : "border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.1)]",
            )}
          >
            {currentStep.operation}
          </span>
          <span className="text-xs text-foreground-muted">
            {currentStep.description}
          </span>
          <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
            Step {stepIndex + 1}/{steps.length}
          </span>
        </div>
      )}
      </div>

      {/* Keyframe for step description fade-in */}
      <style>{`
        @keyframes btree-step-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes btree-step-fade-in {
            from, to { opacity: 1; transform: none; }
          }
        }
      `}</style>

      {/* Prediction overlay (DBL-129) */}
      {predictionMode && predictionPaused && predictionQuestion && onPredictionSelect && (
        <div className="mx-4 mt-3 mb-2 rounded-xl border border-violet-500/30 bg-violet-950/40 p-5 shadow-lg">
          <div className="mb-3 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">
              Prediction Challenge
            </span>
            {predictionScore && (
              <span className="ml-auto font-mono text-[10px] text-violet-300">
                Score: {predictionScore.correct}/{predictionScore.total}
              </span>
            )}
          </div>
          <p className="mb-4 text-sm text-foreground">{predictionQuestion}</p>
          <div className="space-y-2">
            {(predictionOptions ?? []).map((opt) => {
              const hasAnswered = predictionSelectedOption !== null && predictionSelectedOption !== undefined;
              const selected = predictionSelectedOption === opt.childIndex;
              const showCorrect = hasAnswered && opt.childIndex === predictionCorrectIndex;
              const showWrong = selected && opt.childIndex !== predictionCorrectIndex;
              return (
                <button
                  key={opt.childIndex}
                  onClick={() => !hasAnswered && onPredictionSelect(opt.childIndex)}
                  disabled={hasAnswered}
                  className={cn(
                    "w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-all",
                    !hasAnswered && "cursor-pointer hover:bg-primary/10",
                    !hasAnswered && "border-primary/30 bg-primary/5 text-foreground",
                    showCorrect && "border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm text-green-300 shadow-[0_0_8px_rgba(34,197,94,0.1)]",
                    showWrong && "border-red-500/30 bg-red-500/5 backdrop-blur-sm text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
                    hasAnswered && !showCorrect && !showWrong && "border-border/50 bg-elevated/50 text-foreground-subtle opacity-60",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {showCorrect && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                    {showWrong && <XCircle className="h-4 w-4 text-red-400" />}
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
          {predictionSelectedOption !== null && predictionSelectedOption !== undefined && (
            <div
              className={cn(
                "mt-4 rounded-xl border p-3 text-xs",
                predictionSelectedOption === predictionCorrectIndex
                  ? "border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm text-green-300"
                  : "border-red-500/30 bg-red-500/5 backdrop-blur-sm text-red-300",
              )}
            >
              <p className="mb-1 font-bold">
                {predictionSelectedOption === predictionCorrectIndex ? "Correct!" : "Not quite..."}
              </p>
              <p className="text-foreground-muted">{predictionExplanation}</p>
            </div>
          )}
        </div>
      )}

      {/* SVG tree */}
      <div className="flex-1 overflow-auto p-4">
        <svg
          role="img"
          aria-label={`B-Tree index visualization with ${nodeCount} nodes`}
          width={svgWidth}
          height={svgHeight}
          className="mx-auto"
        >
          <defs>
            <pattern
              id="btree-grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                style={{ stroke: 'var(--elevated)' }}
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#btree-grid)" />
          {renderBTreeNode(layout, highlightNodeId, highlightKey, knownNodeIds, hoveredNodeId, handleHoverNode)}
        </svg>
      </div>
    </div>
  );
});

export default BTreeCanvas;
