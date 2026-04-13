"use client";

import React, { memo } from "react";
import { FileSearch2 } from "lucide-react";
import type { QueryPlanNode } from "@/lib/database";
import { useInactivityPrompt } from "@/hooks/useInactivityPrompt";
import InactivityNudge from "@/components/shared/InactivityNudge";

// ── Types ────────────────────────────────────────────────────

interface QueryPlanCanvasProps {
  plan: QueryPlanNode | null;
  onLoadSample?: () => void;
  onGoToBTree?: () => void;
}

/** Layout data for a plan node. */
export interface PlanLayout {
  node: QueryPlanNode;
  x: number;
  y: number;
  width: number;
  height: number;
  children: PlanLayout[];
}

// ── Constants ────────────────────────────────────────────────

const PLAN_NODE_W = 180;
const PLAN_NODE_H = 56;
const PLAN_H_GAP = 24;
const PLAN_V_GAP = 50;

// ── Layout helpers ───────────────────────────────────────────

export function layoutPlanTree(
  node: QueryPlanNode,
  depth: number,
  xOffset: number,
): PlanLayout {
  if (node.children.length === 0) {
    return {
      node,
      x: xOffset,
      y: depth * (PLAN_NODE_H + PLAN_V_GAP),
      width: PLAN_NODE_W,
      height: PLAN_NODE_H,
      children: [],
    };
  }

  const childLayouts: PlanLayout[] = [];
  let cx = xOffset;
  for (const child of node.children) {
    const cl = layoutPlanTree(child, depth + 1, cx);
    childLayouts.push(cl);
    cx = cl.x + cl.width + PLAN_H_GAP;
  }

  const firstChild = childLayouts[0];
  const lastChild = childLayouts[childLayouts.length - 1];
  const totalWidth =
    lastChild.x + lastChild.width - firstChild.x;
  const centerX =
    firstChild.x + totalWidth / 2 - PLAN_NODE_W / 2;

  return {
    node,
    x: Math.max(xOffset, centerX),
    y: depth * (PLAN_NODE_H + PLAN_V_GAP),
    width: PLAN_NODE_W,
    height: PLAN_NODE_H,
    children: childLayouts,
  };
}

/** Get total cost (= root cost). */
export function totalCost(node: QueryPlanNode): number {
  return node.cost;
}

/** Color-code by cost relative to total. */
export function costColor(cost: number, maxCost: number): string {
  if (maxCost === 0) return "var(--state-success, #22c55e)";
  const ratio = cost / maxCost;
  if (ratio < 0.25) return "var(--state-success, #22c55e)";
  if (ratio < 0.5) return "var(--state-warning, #eab308)";
  if (ratio < 0.75) return "var(--viz-seq-high, #f97316)";
  return "var(--state-error, #ef4444)";
}

/** Text label for cost level (non-color encoding for accessibility). */
function costLabel(cost: number, maxCost: number): string {
  if (maxCost === 0) return "Low";
  const ratio = cost / maxCost;
  if (ratio < 0.25) return "Low";
  if (ratio < 0.5) return "Med";
  if (ratio < 0.75) return "Med";
  return "High";
}

/** Height of the IndexScan link row below the node. */
const INDEX_LINK_H = 18;

function renderPlanNode(
  layout: PlanLayout,
  maxCost: number,
  onGoToBTree?: () => void,
): React.ReactNode {
  const color = costColor(layout.node.cost, maxCost);
  const isIndexScan = layout.node.type === "IndexScan";
  return (
    <g key={layout.node.id}>
      {/* Arrows to children */}
      {layout.children.map((cl) => (
        <g key={`edge-${layout.node.id}-${cl.node.id}`}>
          <line
            x1={layout.x + PLAN_NODE_W / 2}
            y1={layout.y + PLAN_NODE_H}
            x2={cl.x + PLAN_NODE_W / 2}
            y2={cl.y}
            style={{ stroke: 'var(--foreground-subtle)' }}
            strokeWidth={1.5}
            markerEnd="url(#plan-arrow)"
          />
        </g>
      ))}

      {/* Node rounded-xl rect */}
      <rect
        x={layout.x}
        y={layout.y}
        width={PLAN_NODE_W}
        height={PLAN_NODE_H}
        rx={10}
        style={{ fill: 'var(--surface)', stroke: color }}
        strokeWidth={2}
      />

      {/* Left color bar */}
      <rect
        x={layout.x}
        y={layout.y}
        width={6}
        height={PLAN_NODE_H}
        rx={3}
        fill={color}
      />

      {/* Type label */}
      <text
        x={layout.x + 14}
        y={layout.y + 20}
        style={{ fill: 'var(--foreground)' }}
        fontSize="12"
        fontWeight="700"
      >
        {layout.node.type}
        {layout.node.table ? ` (${layout.node.table})` : ""}
      </text>

      {/* Cost + rows with text label for accessibility */}
      <text
        x={layout.x + 14}
        y={layout.y + 38}
        style={{ fill: 'var(--foreground-muted)' }}
        fontSize="10"
      >
        cost: {layout.node.cost.toFixed(2)} | rows: {layout.node.rows}
      </text>
      {/* Cost level text label (non-color encoding) */}
      <text
        x={layout.x + PLAN_NODE_W - 8}
        y={layout.y + 14}
        textAnchor="end"
        style={{ fill: color }}
        fontSize="9"
        fontWeight="700"
      >
        {costLabel(layout.node.cost, maxCost)}
      </text>

      {/* DBL-047: "See in B-Tree mode" link for IndexScan nodes */}
      {isIndexScan && onGoToBTree && (
        <g
          role="link"
          tabIndex={0}
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            onGoToBTree();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onGoToBTree();
            }
          }}
        >
          <text
            x={layout.x + 14}
            y={layout.y + PLAN_NODE_H + INDEX_LINK_H - 4}
            style={{ fill: 'var(--primary-light, #93c5fd)' }}
            fontSize="10"
            fontWeight="600"
            textDecoration="underline"
          >
            {"See in B-Tree mode \u2192"}
          </text>
        </g>
      )}

      {/* Recurse */}
      {layout.children.map((cl) => renderPlanNode(cl, maxCost, onGoToBTree))}
    </g>
  );
}

// ── Component ────────────────────────────────────────────────

const QueryPlanCanvas = memo(function QueryPlanCanvas({
  plan,
  onLoadSample,
  onGoToBTree,
}: QueryPlanCanvasProps) {
  const isEmpty = !plan;

  const { showPrompt: showInactivityPrompt, dismiss: dismissInactivity } =
    useInactivityPrompt("query-plans", isEmpty);

  if (!plan) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-b from-elevated/80 to-background">
        <div className="text-center max-w-sm">
          <FileSearch2 className="mx-auto mb-3 h-16 w-16 text-foreground-subtle opacity-30" />
          <p className="mb-2 text-sm font-medium text-foreground">
            Your SQL might scan 10 million rows. Or just 5. See why.
          </p>
          <p className="mb-4 text-xs text-foreground-muted">
            Enter a SQL query and click Analyze to see the execution plan tree with cost estimates.
          </p>
          {onLoadSample && (
            <button
              onClick={onLoadSample}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Analyze: SELECT * FROM users WHERE id = 1
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

  const layout = layoutPlanTree(plan, 0, 30);
  const maxCost = totalCost(plan);

  function getBounds(l: PlanLayout): { maxX: number; maxY: number } {
    let maxX = l.x + l.width;
    let maxY = l.y + l.height;
    for (const c of l.children) {
      const cb = getBounds(c);
      maxX = Math.max(maxX, cb.maxX);
      maxY = Math.max(maxY, cb.maxY);
    }
    return { maxX, maxY };
  }

  const bounds = getBounds(layout);
  const svgWidth = Math.max(bounds.maxX + 40, 400);
  const svgHeight = Math.max(bounds.maxY + 40, 200);

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-gradient-to-b from-elevated/80 to-background">
      {/* Total cost bar */}
      <div className="flex items-center gap-3 border-b border-border/30 bg-elevated/30 backdrop-blur-sm px-4 py-2">
        <span className="text-xs font-semibold text-foreground-muted">
          Total Estimated Cost:
        </span>
        <span className="font-mono text-sm font-bold text-primary">
          {maxCost.toFixed(2)}
        </span>
        <div className="ml-auto flex items-center gap-2 text-[10px] text-foreground-subtle">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            Low
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" />
            Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            High
          </span>
        </div>
      </div>

      {/* SVG plan tree */}
      <div className="flex-1 overflow-auto p-4">
        <svg role="img" aria-label="SQL query execution plan tree" width={svgWidth} height={svgHeight} className="mx-auto">
          <defs>
            <marker
              id="plan-arrow"
              markerWidth="8"
              markerHeight="6"
              refX="4"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" style={{ fill: 'var(--foreground-subtle)' }} />
            </marker>
          </defs>
          {renderPlanNode(layout, maxCost, onGoToBTree)}
        </svg>
      </div>
    </div>
  );
});

export default QueryPlanCanvas;
