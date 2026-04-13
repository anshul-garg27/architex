"use client";

import React, { memo, useMemo } from "react";
import { motion } from "motion/react";
import { DS_COLORS, dsColorBg, ANIM_DURATION, getHighlight } from "../constants";
import type { DSStep } from "@/lib/data-structures";
import type { DisjointSetState, SkipListState } from "@/lib/data-structures";
import { dsuGetSets } from "@/lib/data-structures";

interface UFLayoutNode {
  id: string;
  value: number;
  x: number;
  y: number;
  parentId: string;
  isRoot: boolean;
}

function layoutUnionFind(state: DisjointSetState): { nodes: UFLayoutNode[]; width: number; height: number } {
  const sets = dsuGetSets(state);
  const nodes: UFLayoutNode[] = [];
  const treeSpacing = 120;
  const nodeSpacing = 50;
  let globalX = 40;
  const rootY = 30;
  const childY = 90;
  const grandchildY = 150;

  for (const set of sets) {
    // Find the root of this set
    let rootValue = set[0];
    for (const v of set) {
      const elem = state.elements.get(`dsu-${v}`);
      if (elem && elem.parent === elem.id) {
        rootValue = v;
        break;
      }
    }

    // Place root
    const rootX = globalX;
    nodes.push({
      id: `dsu-${rootValue}`,
      value: rootValue,
      x: rootX,
      y: rootY,
      parentId: `dsu-${rootValue}`,
      isRoot: true,
    });

    // Place direct children of root
    const directChildren = set.filter((v) => {
      if (v === rootValue) return false;
      const elem = state.elements.get(`dsu-${v}`);
      return elem && elem.parent === `dsu-${rootValue}`;
    });

    const grandchildren = set.filter((v) => {
      if (v === rootValue) return false;
      const elem = state.elements.get(`dsu-${v}`);
      return elem && elem.parent !== `dsu-${rootValue}` && elem.parent !== elem.id;
    });

    let childX = rootX - ((directChildren.length - 1) * nodeSpacing) / 2;
    for (const cv of directChildren) {
      const elem = state.elements.get(`dsu-${cv}`)!;
      nodes.push({
        id: elem.id,
        value: cv,
        x: childX,
        y: childY,
        parentId: elem.parent,
        isRoot: false,
      });
      childX += nodeSpacing;
    }

    let gcX = rootX - ((grandchildren.length - 1) * nodeSpacing) / 2;
    for (const gv of grandchildren) {
      const elem = state.elements.get(`dsu-${gv}`)!;
      nodes.push({
        id: elem.id,
        value: gv,
        x: gcX,
        y: grandchildY,
        parentId: elem.parent,
        isRoot: false,
      });
      gcX += nodeSpacing;
    }

    globalX += Math.max(treeSpacing, Math.max(directChildren.length, grandchildren.length, 1) * nodeSpacing + 20);
  }

  const maxY = nodes.length > 0 ? Math.max(...nodes.map((n) => n.y)) + 40 : 100;
  return { nodes, width: Math.max(globalX, 200), height: maxY };
}

const UnionFindCanvas = memo(function UnionFindCanvas({
  dsu,
  stepIdx,
  steps,
}: {
  dsu: DisjointSetState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const { nodes: laid, width: svgWidth, height: svgHeight } = useMemo(() => layoutUnionFind(dsu), [dsu]);
  const nodeMap = useMemo(() => new Map(laid.map((n) => [n.id, n])), [laid]);
  const nodeRadius = 18;

  const sets = useMemo(() => dsuGetSets(dsu), [dsu]);

  if (dsu.size === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">Union-Find is empty. Insert a number to MakeSet, or enter two numbers to Union.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Union-Find ({dsu.size} elements, {sets.length} set{sets.length !== 1 ? "s" : ""})
      </h3>
      <svg role="img" aria-label={`Union-Find visualization showing ${dsu.size} elements`} width={svgWidth} height={svgHeight} className="max-w-full">
        {/* Edges (child -> parent) */}
        {laid.filter((n) => !n.isRoot).map((n) => {
          const parent = nodeMap.get(n.parentId);
          if (!parent) return null;
          const hl = getHighlight(stepIdx, steps, n.id);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          return (
            <motion.line
              key={`edge-${n.id}`}
              x1={n.x} y1={n.y - nodeRadius}
              x2={parent.x} y2={parent.y + nodeRadius}
              initial={false}
              animate={{ stroke: color, strokeWidth: hl !== "default" ? 2 : 1.5 }}
              transition={{ duration: ANIM_DURATION }}
              markerEnd="url(#arrowhead)"
            />
          );
        })}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="var(--ds-default)" />
          </marker>
        </defs>
        {/* Nodes */}
        {laid.map((n) => {
          const hl = getHighlight(stepIdx, steps, n.id);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          const elem = dsu.elements.get(n.id);
          const rank = elem?.rank ?? 0;
          return (
            <motion.g key={n.id}>
              <motion.circle
                cx={n.x} cy={n.y} r={nodeRadius}
                initial={false}
                animate={{
                  fill: dsColorBg(hl, n.isRoot ? "#1e3a5f" : "var(--ds-node-fill)"),
                  stroke: hl !== "default" ? color : n.isRoot ? "#3b82f6" : "var(--ds-default)",
                  strokeWidth: hl !== "default" ? 2.5 : n.isRoot ? 2 : 1.5,
                }}
                transition={{ duration: ANIM_DURATION }}
              />
              <text x={n.x} y={n.y + 4} textAnchor="middle" className="text-[11px] font-semibold" fill={hl !== "default" ? color : n.isRoot ? "#60a5fa" : "#9ca3af"}>
                {n.value}
              </text>
              {/* Rank label for roots */}
              {n.isRoot && (
                <text x={n.x} y={n.y - nodeRadius - 4} textAnchor="middle" className="text-[10px]" fill="var(--ds-default)">
                  r={rank}
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>
      {/* Set summary */}
      <div className="flex flex-wrap gap-2 justify-center">
        {sets.map((set, i) => (
          <span key={`uf-set-${i}-${set[0]}`} className="rounded-xl bg-elevated/50 backdrop-blur-sm border border-border/30 px-2 py-0.5 font-mono text-[10px] text-foreground-muted">
            {"{" + set.join(", ") + "}"}
          </span>
        ))}
      </div>
    </div>
  );
});

const SkipListCanvas = memo(function SkipListCanvas({
  skipList,
  stepIdx,
  steps,
}: {
  skipList: SkipListState;
  stepIdx: number;
  steps: DSStep[];
}) {
  // Build level arrays for rendering
  const levels = useMemo(() => {
    const result: { level: number; nodes: { id: string; value: number }[] }[] = [];
    for (let lvl = skipList.maxLevel; lvl >= 0; lvl--) {
      const levelNodes: { id: string; value: number }[] = [];
      let currentId = skipList.nodes.get(skipList.headId)?.forward[lvl] ?? null;
      while (currentId) {
        const node = skipList.nodes.get(currentId);
        if (!node) break;
        levelNodes.push({ id: node.id, value: node.value });
        currentId = node.forward[lvl];
      }
      result.push({ level: lvl, nodes: levelNodes });
    }
    return result;
  }, [skipList]);

  if (skipList.size === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">Skip list is empty. Insert values to see multi-level structure.</p>
      </div>
    );
  }

  return (
    <div role="img" aria-label={`Skip List visualization showing ${skipList.size} elements`} className="flex flex-col items-center gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Skip List (size {skipList.size}, levels 0-{skipList.maxLevel})
      </h3>
      <div className="flex flex-col gap-1">
        {levels.map(({ level, nodes }) => (
          <div key={level} className="flex items-center gap-1">
            <span className="w-12 text-right text-[10px] font-mono text-foreground-subtle mr-2">
              L{level}
            </span>
            <span className="flex h-7 w-10 items-center justify-center rounded border border-dashed border-foreground-subtle text-[10px] text-foreground-subtle">
              HEAD
            </span>
            {nodes.map((node) => {
              const hl = getHighlight(stepIdx, steps, node.id);
              const color = DS_COLORS[hl] ?? DS_COLORS.default;
              return (
                <React.Fragment key={`${level}-${node.id}`}>
                  <svg width="16" height="8" className="shrink-0">
                    <line x1="0" y1="4" x2="10" y2="4" stroke={color} strokeWidth="1" />
                    <polygon points="10,1.5 16,4 10,6.5" fill={color} />
                  </svg>
                  <motion.div
                    className="flex h-7 w-10 items-center justify-center rounded border font-mono text-xs font-medium"
                    initial={false}
                    animate={{
                      borderColor: color,
                      backgroundColor: dsColorBg(hl),
                      color,
                    }}
                    transition={{ duration: ANIM_DURATION }}
                  >
                    {node.value}
                  </motion.div>
                </React.Fragment>
              );
            })}
            <svg width="16" height="8" className="shrink-0">
              <line x1="0" y1="4" x2="10" y2="4" stroke="var(--ds-default)" strokeWidth="1" />
              <polygon points="10,1.5 16,4 10,6.5" fill="var(--ds-default)" />
            </svg>
            <span className="text-[10px] text-foreground-subtle">NULL</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export { UnionFindCanvas, SkipListCanvas };
