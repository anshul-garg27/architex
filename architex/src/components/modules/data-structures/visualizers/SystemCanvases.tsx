"use client";

import React, { memo, useMemo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { DS_COLORS, dsColorBg, ANIM_DURATION, getHighlight } from "../constants";
import type { DSStep } from "@/lib/data-structures";
import type { LSMState, CHState, RTreeState, RTreeFlatNode, QuadtreeState } from "@/lib/data-structures";
import { flattenRTree, flattenQuadtree } from "@/lib/data-structures";

const LSMTreeCanvas = memo(function LSMTreeCanvas({
  lsm,
  stepIdx,
  steps,
}: {
  lsm: LSMState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const memHl = getHighlight(stepIdx, steps, "memtable");
  const memColor = DS_COLORS[memHl] ?? DS_COLORS.default;
  const immHl = getHighlight(stepIdx, steps, "immutable");
  const immColor = DS_COLORS[immHl] ?? DS_COLORS.default;

  return (
    <div role="img" aria-label={`LSM Tree visualization showing ${lsm.memtable.length} memtable entries`} className="flex flex-col items-center gap-5 w-full max-w-3xl">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        LSM Tree (capacity {lsm.memtableCapacity})
      </h3>

      {/* Pipeline layout */}
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Memtable */}
        <motion.div
          className="w-full rounded-lg border-2 p-3"
          initial={false}
          animate={{
            borderColor: memHl !== "default" ? memColor : "#3b82f6",
            backgroundColor: memHl !== "default" ? memColor + "10" : "#3b82f610",
          }}
          transition={{ duration: ANIM_DURATION }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
              Memtable ({lsm.memtable.length}/{lsm.memtableCapacity})
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {lsm.memtable.length === 0 ? (
              <span className="text-[10px] text-foreground-subtle italic">empty</span>
            ) : (
              lsm.memtable.map((entry, i) => {
                const hl = getHighlight(stepIdx, steps, `mem-${i}`);
                const color = DS_COLORS[hl] ?? DS_COLORS.default;
                return (
                  <motion.div
                    key={`mem-${i}`}
                    className="flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px]"
                    initial={false}
                    animate={{
                      borderColor: hl !== "default" ? color : "#374151",
                      backgroundColor: dsColorBg(hl),
                      color: hl !== "default" ? color : "#9ca3af",
                    }}
                    transition={{ duration: ANIM_DURATION }}
                  >
                    <span className="font-medium">{entry.key}</span>
                    <span className="text-foreground-subtle">:</span>
                    <span>{entry.value}</span>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Arrow down */}
        <svg width="20" height="24" className="shrink-0">
          <line x1="10" y1="0" x2="10" y2="18" stroke="var(--ds-default)" strokeWidth="1.5" />
          <polygon points="6,18 10,24 14,18" fill="var(--ds-default)" />
        </svg>

        {/* Immutable Memtable */}
        <motion.div
          className="w-full rounded-lg border-2 border-dashed p-3"
          initial={false}
          animate={{
            borderColor: immHl !== "default" ? immColor : lsm.immutableMemtable ? "#f59e0b" : "#374151",
            backgroundColor: immHl !== "default" ? immColor + "10" : lsm.immutableMemtable ? "#f59e0b10" : "transparent",
            opacity: lsm.immutableMemtable ? 1 : 0.4,
          }}
          transition={{ duration: ANIM_DURATION }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              Immutable Memtable {lsm.immutableMemtable ? `(${lsm.immutableMemtable.length} entries)` : "(empty)"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {!lsm.immutableMemtable || lsm.immutableMemtable.length === 0 ? (
              <span className="text-[10px] text-foreground-subtle italic">--</span>
            ) : (
              lsm.immutableMemtable.map((entry, i) => (
                <div key={`imm-${i}`} className="flex items-center gap-1 rounded border border-amber-700/30 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                  <span className="font-medium">{entry.key}</span>:<span>{entry.value}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Arrow down */}
        <svg width="20" height="24" className="shrink-0">
          <line x1="10" y1="0" x2="10" y2="18" stroke="var(--ds-default)" strokeWidth="1.5" />
          <polygon points="6,18 10,24 14,18" fill="var(--ds-default)" />
        </svg>

        {/* Levels */}
        {lsm.levels.map((level, lvlIdx) => {
          const lvlHl = getHighlight(stepIdx, steps, `l${lvlIdx}`);
          const lvlColor = DS_COLORS[lvlHl] ?? DS_COLORS.default;
          const levelColors = ["#22c55e", "#06b6d4", "#a855f7"];
          const baseColor = levelColors[lvlIdx] ?? "var(--ds-default)";

          return (
            <React.Fragment key={`level-${lvlIdx}`}>
              <motion.div
                className="w-full rounded-lg border p-3"
                initial={false}
                animate={{
                  borderColor: lvlHl !== "default" ? lvlColor : baseColor + "40",
                  backgroundColor: lvlHl !== "default" ? lvlColor + "10" : baseColor + "08",
                }}
                transition={{ duration: ANIM_DURATION }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: baseColor }}>
                    Level {lvlIdx} ({level.length} SSTable{level.length !== 1 ? "s" : ""})
                  </span>
                </div>
                {level.length === 0 ? (
                  <span className="text-[10px] text-foreground-subtle italic">empty</span>
                ) : (
                  <div className="flex flex-col gap-2">
                    {level.map((table, tIdx) => {
                      const tHl = getHighlight(stepIdx, steps, `l${lvlIdx}-${tIdx}`);
                      const tColor = DS_COLORS[tHl] ?? DS_COLORS.default;
                      return (
                        <motion.div
                          key={`l${lvlIdx}-t${tIdx}`}
                          className="rounded border p-2"
                          initial={false}
                          animate={{
                            borderColor: tHl !== "default" ? tColor : "#374151",
                            backgroundColor: tHl !== "default" ? tColor + "15" : "transparent",
                          }}
                          transition={{ duration: ANIM_DURATION }}
                        >
                          <span className="text-[10px] text-foreground-subtle">SSTable #{tIdx} ({table.length} entries)</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {table.slice(0, 12).map((entry, eIdx) => (
                              <span key={eIdx} className="rounded-xl bg-elevated/50 border border-border/30 px-1 py-0.5 font-mono text-[10px] text-foreground-muted">
                                {entry.key}:{entry.value}
                              </span>
                            ))}
                            {table.length > 12 && (
                              <span className="text-[10px] text-foreground-subtle">+{table.length - 12} more</span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
              {lvlIdx < lsm.levels.length - 1 && (
                <svg width="20" height="24" className="shrink-0">
                  <line x1="10" y1="0" x2="10" y2="18" stroke="var(--ds-default)" strokeWidth="1.5" strokeDasharray="4 2" />
                  <polygon points="6,18 10,24 14,18" fill="var(--ds-default)" />
                </svg>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
});

const ConsistentHashRingCanvas = memo(function ConsistentHashRingCanvas({
  ring,
  stepIdx,
  steps,
}: {
  ring: CHState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const svgSize = 400;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const ringRadius = 150;
  const nodeRadius = 14;
  const keyRadius = 6;

  // Compute node positions on the circle
  const nodePositions = useMemo(() => {
    return ring.nodes.map((node) => {
      const angle = (node.position / 360) * 2 * Math.PI - Math.PI / 2;
      return {
        ...node,
        x: cx + ringRadius * Math.cos(angle),
        y: cy + ringRadius * Math.sin(angle),
        angle,
      };
    });
  }, [ring.nodes, cx, cy]);

  // Compute key positions (slightly inside the ring)
  const keyPositions = useMemo(() => {
    const innerRadius = ringRadius - 28;
    return ring.keys.map((key) => {
      const angle = (key.position / 360) * 2 * Math.PI - Math.PI / 2;
      return {
        ...key,
        x: cx + innerRadius * Math.cos(angle),
        y: cy + innerRadius * Math.sin(angle),
        angle,
      };
    });
  }, [ring.keys, cx, cy]);

  // Distribution stats
  const distribution = useMemo(() => {
    const dist = new Map<string, number>();
    for (const node of ring.nodes) dist.set(node.id, 0);
    for (const key of ring.keys) {
      dist.set(key.owner, (dist.get(key.owner) ?? 0) + 1);
    }
    return dist;
  }, [ring]);

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Consistent Hash Ring ({ring.nodes.length} node{ring.nodes.length !== 1 ? "s" : ""}, {ring.keys.length} key{ring.keys.length !== 1 ? "s" : ""})
      </h3>

      <svg role="img" aria-label={`Consistent Hash Ring visualization showing ${ring.nodes.length} nodes and ${ring.keys.length} keys`} width={svgSize} height={svgSize} className="max-w-full">
        {/* Ring circle */}
        <circle
          cx={cx}
          cy={cy}
          r={ringRadius}
          fill="none"
          stroke="var(--ds-node-fill)"
          strokeWidth="2"
        />

        {/* Degree markers */}
        {[0, 90, 180, 270].map((deg) => {
          const angle = (deg / 360) * 2 * Math.PI - Math.PI / 2;
          const x1 = cx + (ringRadius - 5) * Math.cos(angle);
          const y1 = cy + (ringRadius - 5) * Math.sin(angle);
          const x2 = cx + (ringRadius + 5) * Math.cos(angle);
          const y2 = cy + (ringRadius + 5) * Math.sin(angle);
          return (
            <g key={deg}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4b5563" strokeWidth="1" />
              <text
                x={cx + (ringRadius + 18) * Math.cos(angle)}
                y={cy + (ringRadius + 18) * Math.sin(angle) + 3}
                textAnchor="middle"
                className="text-[10px]"
                fill="var(--ds-default)"
              >
                {deg}
              </text>
            </g>
          );
        })}

        {/* Key-to-node assignment lines */}
        {keyPositions.map((kp) => {
          const ownerNode = nodePositions.find((np) => np.id === kp.owner);
          if (!ownerNode) return null;
          const khl = getHighlight(stepIdx, steps, `key-${kp.key}`);
          const kColor = DS_COLORS[khl] ?? "#374151";
          return (
            <motion.line
              key={`assign-${kp.key}`}
              x1={kp.x}
              y1={kp.y}
              x2={ownerNode.x}
              y2={ownerNode.y}
              initial={false}
              animate={{
                stroke: khl !== "default" ? kColor : "#374151",
                strokeWidth: khl !== "default" ? 1.5 : 0.5,
                opacity: khl !== "default" ? 0.8 : 0.2,
              }}
              transition={{ duration: ANIM_DURATION }}
              strokeDasharray="2 2"
            />
          );
        })}

        {/* Keys */}
        {keyPositions.map((kp) => {
          const khl = getHighlight(stepIdx, steps, `key-${kp.key}`);
          const kColor = DS_COLORS[khl] ?? "#f59e0b";
          return (
            <motion.g key={`key-${kp.key}`}>
              <motion.circle
                cx={kp.x}
                cy={kp.y}
                r={keyRadius}
                initial={false}
                animate={{
                  fill: khl !== "default" ? kColor + "40" : "#f59e0b20",
                  stroke: khl !== "default" ? kColor : "#f59e0b",
                  strokeWidth: khl !== "default" ? 2 : 1,
                }}
                transition={{ duration: ANIM_DURATION }}
              />
              {ring.keys.length <= 20 && (
                <text
                  x={kp.x}
                  y={kp.y - keyRadius - 3}
                  textAnchor="middle"
                  className="text-[10px]"
                  fill="#f59e0b"
                >
                  {kp.key.length > 8 ? kp.key.slice(0, 8) + ".." : kp.key}
                </text>
              )}
            </motion.g>
          );
        })}

        {/* Nodes */}
        {nodePositions.map((np) => {
          const nhl = getHighlight(stepIdx, steps, `node-${np.id}`);
          const nColor = DS_COLORS[nhl] ?? "#3b82f6";
          return (
            <motion.g key={`node-${np.id}`}>
              <motion.circle
                cx={np.x}
                cy={np.y}
                r={nodeRadius}
                initial={false}
                animate={{
                  fill: nhl !== "default" ? nColor + "30" : "#1e3a5f",
                  stroke: nhl !== "default" ? nColor : "#3b82f6",
                  strokeWidth: nhl !== "default" ? 3 : 2,
                }}
                transition={{ duration: ANIM_DURATION }}
              />
              <text
                x={np.x}
                y={np.y + 4}
                textAnchor="middle"
                className="text-[10px] font-bold"
                fill={nhl !== "default" ? nColor : "#60a5fa"}
              >
                {np.id.length > 4 ? np.id.slice(0, 4) : np.id}
              </text>
              {/* Label outside ring */}
              <text
                x={cx + (ringRadius + 32) * Math.cos(np.angle)}
                y={cy + (ringRadius + 32) * Math.sin(np.angle) + 3}
                textAnchor="middle"
                className="text-[10px] font-medium"
                fill="#9ca3af"
              >
                {np.id} ({np.position})
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* Distribution stats */}
      {ring.nodes.length > 0 && ring.keys.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {ring.nodes.map((node) => {
            const count = distribution.get(node.id) ?? 0;
            const pct = ring.keys.length > 0 ? ((count / ring.keys.length) * 100).toFixed(1) : "0";
            return (
              <div key={node.id} className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-foreground-muted">{node.id}</div>
                <div className="font-mono text-sm font-medium text-foreground">{count} <span className="text-[10px] text-foreground-subtle">({pct}%)</span></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

const RTreeCanvas = memo(function RTreeCanvas({
  rTree,
  stepIdx,
  steps,
}: {
  rTree: RTreeState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const flat = useMemo(() => flattenRTree(rTree), [rTree]);
  const svgW = 320;
  const svgH = 320;
  const pad = 10;

  // Compute scale from data extent
  const allPoints: { x: number; y: number }[] = [];
  for (const n of flat) {
    for (const e of n.entries) {
      allPoints.push({ x: e.x, y: e.y });
    }
  }
  const xMin = allPoints.length > 0 ? Math.min(...allPoints.map((p) => p.x)) - 5 : 0;
  const xMax = allPoints.length > 0 ? Math.max(...allPoints.map((p) => p.x)) + 5 : 100;
  const yMin = allPoints.length > 0 ? Math.min(...allPoints.map((p) => p.y)) - 5 : 0;
  const yMax = allPoints.length > 0 ? Math.max(...allPoints.map((p) => p.y)) + 5 : 100;
  const xRange = Math.max(xMax - xMin, 1);
  const yRange = Math.max(yMax - yMin, 1);

  function sx(v: number): number {
    return pad + ((v - xMin) / xRange) * (svgW - 2 * pad);
  }
  function sy(v: number): number {
    return pad + ((v - yMin) / yRange) * (svgH - 2 * pad);
  }

  const depthColors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"];

  if (!rTree.root) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">R-Tree is empty. Insert points like &quot;30,50&quot;</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        R-Tree (max entries/node: {rTree.maxEntries}, size: {rTree.size})
      </h3>
      <svg role="img" aria-label={`R-Tree visualization showing ${rTree.size} elements`} width={svgW} height={svgH} className="rounded-xl border border-border/30 bg-elevated/50">
        {/* Grid lines */}
        {Array.from({ length: 5 }, (_, i) => {
          const xv = xMin + (xRange * (i + 1)) / 6;
          const yv = yMin + (yRange * (i + 1)) / 6;
          return (
            <g key={`grid-${i}`}>
              <line x1={sx(xv)} y1={pad} x2={sx(xv)} y2={svgH - pad} stroke="var(--ds-node-fill)" strokeWidth={0.5} />
              <line x1={pad} y1={sy(yv)} x2={svgW - pad} y2={sy(yv)} stroke="var(--ds-node-fill)" strokeWidth={0.5} />
            </g>
          );
        })}
        {/* Bounding boxes */}
        {flat.map((n) => {
          const hl = getHighlight(stepIdx, steps, n.id);
          const color = hl !== "default" ? (DS_COLORS[hl] ?? DS_COLORS.default) : depthColors[n.depth % depthColors.length];
          const bx = sx(n.bbox.minX);
          const by = sy(n.bbox.minY);
          const bw = sx(n.bbox.maxX) - bx;
          const bh = sy(n.bbox.maxY) - by;
          return (
            <rect
              key={n.id}
              x={bx}
              y={by}
              width={Math.max(bw, 2)}
              height={Math.max(bh, 2)}
              fill={color + "15"}
              stroke={color}
              strokeWidth={n.isLeaf ? 1 : 1.5}
              strokeDasharray={n.isLeaf ? "3,2" : "none"}
              rx={2}
            />
          );
        })}
        {/* Points */}
        {flat
          .filter((n) => n.isLeaf)
          .flatMap((n) =>
            n.entries.map((e) => {
              const hl = getHighlight(stepIdx, steps, e.id);
              const color = hl !== "default" ? (DS_COLORS[hl] ?? DS_COLORS.default) : "#c7d2fe";
              return (
                <g key={e.id}>
                  <circle cx={sx(e.x)} cy={sy(e.y)} r={4} fill={color} opacity={0.9} />
                  <text x={sx(e.x)} y={sy(e.y) - 6} textAnchor="middle" fill="#9ca3af" fontSize={10}>
                    ({e.x},{e.y})
                  </text>
                </g>
              );
            }),
          )}
      </svg>
      {/* Stats */}
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Points</div>
          <div className="font-mono text-sm font-medium text-foreground">{rTree.size}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Nodes</div>
          <div className="font-mono text-sm font-medium text-blue-400">{flat.length}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Max Depth</div>
          <div className="font-mono text-sm font-medium text-amber-400">
            {flat.length > 0 ? Math.max(...flat.map((n) => n.depth)) : 0}
          </div>
        </div>
      </div>
    </div>
  );
});

const QuadtreeCanvas = memo(function QuadtreeCanvas({
  quadtree,
  stepIdx,
  steps,
}: {
  quadtree: QuadtreeState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const flat = useMemo(() => flattenQuadtree(quadtree), [quadtree]);

  if (quadtree.size === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">Quadtree is empty. Insert points like &quot;30,50&quot; for spatial indexing.</p>
      </div>
    );
  }

  const svgW = 320;
  const svgH = 320;
  const pad = 10;

  const rootBounds = quadtree.root.bounds;
  const fullW = rootBounds.hw * 2;
  const fullH = rootBounds.hh * 2;

  function sx(v: number): number {
    return pad + (v / fullW) * (svgW - 2 * pad);
  }
  function sy(v: number): number {
    return pad + (v / fullH) * (svgH - 2 * pad);
  }

  const depthColors = ["#374151", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"];

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Quadtree (capacity: {quadtree.capacity}, size: {quadtree.size})
      </h3>
      <svg role="img" aria-label={`Quadtree visualization showing ${quadtree.size} elements`} width={svgW} height={svgH} className="rounded-xl border border-border/30 bg-elevated/50">
        {/* Quadrant boundaries */}
        {flat.map((n) => {
          const hl = getHighlight(stepIdx, steps, n.id);
          const color = hl !== "default" ? (DS_COLORS[hl] ?? DS_COLORS.default) : depthColors[Math.min(n.depth, depthColors.length - 1)];
          const bx = sx(n.bounds.x - n.bounds.hw);
          const by = sy(n.bounds.y - n.bounds.hh);
          const bw = sx(n.bounds.x + n.bounds.hw) - bx;
          const bh = sy(n.bounds.y + n.bounds.hh) - by;
          return (
            <rect
              key={n.id}
              x={bx}
              y={by}
              width={bw}
              height={bh}
              fill={n.divided ? "transparent" : color + "08"}
              stroke={color}
              strokeWidth={n.depth === 0 ? 2 : 1}
              strokeOpacity={0.6}
            />
          );
        })}
        {/* Points */}
        {flat.flatMap((n) =>
          n.points.map((p) => {
            const hl = getHighlight(stepIdx, steps, p.id);
            const color = hl !== "default" ? (DS_COLORS[hl] ?? DS_COLORS.default) : "#c7d2fe";
            return (
              <g key={p.id}>
                <circle cx={sx(p.x)} cy={sy(p.y)} r={4} fill={color} opacity={0.9} />
                <text x={sx(p.x)} y={sy(p.y) - 6} textAnchor="middle" fill="#9ca3af" fontSize={10}>
                  ({Math.round(p.x)},{Math.round(p.y)})
                </text>
              </g>
            );
          }),
        )}
      </svg>
      {/* Stats */}
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Points</div>
          <div className="font-mono text-sm font-medium text-foreground">{quadtree.size}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Regions</div>
          <div className="font-mono text-sm font-medium text-blue-400">{flat.length}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Max Depth</div>
          <div className="font-mono text-sm font-medium text-amber-400">
            {flat.length > 0 ? Math.max(...flat.map((n) => n.depth)) : 0}
          </div>
        </div>
      </div>
    </div>
  );
});

export { LSMTreeCanvas, ConsistentHashRingCanvas, RTreeCanvas, QuadtreeCanvas };
