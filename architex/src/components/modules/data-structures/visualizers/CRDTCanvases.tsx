"use client";

import React, { memo, useMemo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { DS_COLORS, dsColorBg, ANIM_DURATION, getHighlight } from "../constants";
import type { CRDTType } from "../types";
import { CRDT_TYPE_LABELS } from "../types";
import type { DSStep } from "@/lib/data-structures";
import type { GCounterState, PNCounterState, LWWRegisterState, ORSetState, VectorClockState } from "@/lib/data-structures";

const CRDTCanvas = memo(function CRDTCanvas({
  crdtType,
  counter,
  pnCounter,
  lwwRegister,
  orSet,
  stepIdx,
  steps,
  onTypeChange,
}: {
  crdtType: CRDTType;
  counter: GCounterState;
  pnCounter: PNCounterState;
  lwwRegister: LWWRegisterState;
  orSet: ORSetState;
  stepIdx: number;
  steps: DSStep[];
  onTypeChange: (type: CRDTType) => void;
}) {
  const nodeColors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"];

  return (
    <div role="img" aria-label={`CRDT visualization`} className="flex flex-col items-center gap-4 w-full">
      {/* Sub-type selector */}
      <div className="flex gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-1">
        {(Object.keys(CRDT_TYPE_LABELS) as CRDTType[]).map((t) => (
          <button
            key={t}
            onClick={() => onTypeChange(t)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              crdtType === t
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground-muted hover:bg-accent/50 hover:text-foreground",
            )}
          >
            {CRDT_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* G-Counter view */}
      {crdtType === 'g-counter' && (() => {
        const nodeIds = Object.keys(counter.counts);
        const total = Object.values(counter.counts).reduce((a, b) => a + b, 0);
        if (nodeIds.length === 0) {
          return (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-foreground-muted">G-Counter is empty. Insert with node IDs like &quot;A&quot;, &quot;B&quot;</p>
            </div>
          );
        }
        return (
          <>
            <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
              G-Counter -- {nodeIds.length} node{nodeIds.length !== 1 ? "s" : ""}
            </h3>
            <div className="flex gap-4 items-end">
              {nodeIds.map((nodeId, i) => {
                const count = counter.counts[nodeId] ?? 0;
                const hl = getHighlight(stepIdx, steps, `crdt-gctr-${nodeId}`);
                const hlColor = DS_COLORS[hl] ?? DS_COLORS.default;
                const color = hl !== "default" ? hlColor : nodeColors[i % nodeColors.length];
                const maxCount = Math.max(1, ...Object.values(counter.counts));
                const barHeight = Math.max(20, (count / maxCount) * 100);
                return (
                  <div key={nodeId} className="flex flex-col items-center gap-2">
                    <span className="font-mono text-sm font-bold" style={{ color }}>{count}</span>
                    <motion.div
                      className="rounded-t border-2"
                      style={{ width: 40 }}
                      initial={false}
                      animate={{ height: barHeight, borderColor: color, backgroundColor: color + "30" }}
                      transition={{ duration: 0.5 }}
                    />
                    <span className="text-xs font-medium" style={{ color }}>Node {nodeId}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] uppercase tracking-wider text-foreground-muted">Global Value</span>
              <span className="font-mono text-2xl font-bold text-foreground">{total}</span>
            </div>
            <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-4 py-2">
              <div className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1 text-center">Vector</div>
              <div className="font-mono text-xs text-foreground">
                [{nodeIds.map((id) => `${id}:${counter.counts[id] ?? 0}`).join(", ")}]
              </div>
            </div>
          </>
        );
      })()}

      {/* PN-Counter view */}
      {crdtType === 'pn-counter' && (() => {
        const posIds = Object.keys(pnCounter.positive.counts);
        const negIds = Object.keys(pnCounter.negative.counts);
        const allIds = [...new Set([...posIds, ...negIds])].sort();
        const posTotal = Object.values(pnCounter.positive.counts).reduce((a, b) => a + b, 0);
        const negTotal = Object.values(pnCounter.negative.counts).reduce((a, b) => a + b, 0);
        const value = posTotal - negTotal;
        if (allIds.length === 0) {
          return (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-foreground-muted">PN-Counter is empty. Use insert (increment) or delete (decrement) with node IDs.</p>
            </div>
          );
        }
        const maxVal = Math.max(1, ...Object.values(pnCounter.positive.counts), ...Object.values(pnCounter.negative.counts));
        return (
          <>
            <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
              PN-Counter -- {allIds.length} node{allIds.length !== 1 ? "s" : ""}
            </h3>
            <div className="flex gap-4 items-end">
              {allIds.map((nodeId, i) => {
                const posCount = pnCounter.positive.counts[nodeId] ?? 0;
                const negCount = pnCounter.negative.counts[nodeId] ?? 0;
                const hlPos = getHighlight(stepIdx, steps, `crdt-pn-pos-${nodeId}`);
                const hlNeg = getHighlight(stepIdx, steps, `crdt-pn-neg-${nodeId}`);
                const posColor = hlPos !== "default" ? (DS_COLORS[hlPos] ?? DS_COLORS.default) : "#22c55e";
                const negColor = hlNeg !== "default" ? (DS_COLORS[hlNeg] ?? DS_COLORS.default) : "#ef4444";
                const posHeight = Math.max(8, (posCount / maxVal) * 80);
                const negHeight = Math.max(8, (negCount / maxVal) * 80);
                return (
                  <div key={nodeId} className="flex flex-col items-center gap-1">
                    <span className="font-mono text-[10px] text-foreground-muted">+{posCount} / -{negCount}</span>
                    <div className="flex gap-1 items-end">
                      <motion.div
                        className="rounded-t border"
                        style={{ width: 18 }}
                        initial={false}
                        animate={{ height: posHeight, borderColor: posColor, backgroundColor: posColor + "30" }}
                        transition={{ duration: 0.5 }}
                      />
                      <motion.div
                        className="rounded-t border"
                        style={{ width: 18 }}
                        initial={false}
                        animate={{ height: negHeight, borderColor: negColor, backgroundColor: negColor + "30" }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: nodeColors[i % nodeColors.length] }}>Node {nodeId}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] uppercase tracking-wider text-foreground-muted">Value (P - N)</span>
              <span className="font-mono text-2xl font-bold text-foreground">{value}</span>
              <span className="text-[10px] text-foreground-subtle">P={posTotal}, N={negTotal}</span>
            </div>
          </>
        );
      })()}

      {/* LWW-Register view */}
      {crdtType === 'lww-register' && (() => {
        const val = lwwRegister.value;
        const ts = lwwRegister.timestamp;
        const hl = getHighlight(stepIdx, steps, 'crdt-lww-value');
        const color = hl !== "default" ? (DS_COLORS[hl] ?? DS_COLORS.default) : "#3b82f6";
        return (
          <>
            <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
              LWW-Register (Last-Writer-Wins)
            </h3>
            <motion.div
              className="rounded-lg border-2 px-8 py-6 text-center min-w-[200px]"
              initial={false}
              animate={{ borderColor: color, backgroundColor: color + "10" }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-[10px] uppercase tracking-wider text-foreground-muted mb-2">Current Value</div>
              <div className="font-mono text-2xl font-bold text-foreground">
                {val !== null ? `"${String(val)}"` : "null"}
              </div>
              <div className="mt-3 text-[10px] text-foreground-subtle">
                Timestamp: {ts > 0 ? ts : "none"}
              </div>
            </motion.div>
            <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-4 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1">Semantics</div>
              <div className="text-xs text-foreground">
                Highest timestamp wins on merge. Use insert to set a value, delete to merge with another register.
              </div>
            </div>
          </>
        );
      })()}

      {/* OR-Set view */}
      {crdtType === 'or-set' && (() => {
        const elems = [...new Set(orSet.entries.map((e) => e.element))].sort();
        if (orSet.entries.length === 0) {
          return (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-foreground-muted">OR-Set is empty. Insert to add elements (value=element, extra=nodeId).</p>
            </div>
          );
        }
        return (
          <>
            <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
              OR-Set (Observed-Remove) -- {elems.length} element{elems.length !== 1 ? "s" : ""}, {orSet.entries.length} tag{orSet.entries.length !== 1 ? "s" : ""}
            </h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {elems.map((element) => {
                const tags = orSet.entries.filter((e) => e.element === element);
                return (
                  <motion.div
                    key={element}
                    className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-4 py-3 min-w-[100px] text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="font-mono text-sm font-bold text-foreground">&quot;{element}&quot;</div>
                    <div className="mt-1 flex flex-wrap gap-1 justify-center">
                      {tags.map((t) => {
                        const hl = getHighlight(stepIdx, steps, `crdt-orset-${t.tag}`);
                        const color = hl !== "default" ? (DS_COLORS[hl] ?? DS_COLORS.default) : DS_COLORS.default;
                        return (
                          <span
                            key={t.tag}
                            className="inline-block rounded px-1.5 py-0.5 text-[10px] font-mono border"
                            style={{ borderColor: color, color, backgroundColor: color + "15" }}
                          >
                            {t.tag}
                          </span>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-4 py-2">
              <div className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1 text-center">Elements</div>
              <div className="font-mono text-xs text-foreground text-center">
                &#123;{elems.join(", ")}&#125;
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
});

const VectorClockCanvas = memo(function VectorClockCanvas({
  vc,
  stepIdx,
  steps,
}: {
  vc: VectorClockState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const { nodeIds, events, messages, clocks } = vc;

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">Vector Clock system with nodes: {nodeIds.join(", ")}. Use operations to generate events.</p>
      </div>
    );
  }

  // Space-time diagram
  const svgWidth = Math.max(400, events.length * 50 + 100);
  const svgHeight = nodeIds.length * 80 + 60;
  const nodeColors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"];
  const xScale = 50;
  const xOffset = 60;
  const yGap = 80;
  const yOffset = 40;
  const eventRadius = 10;

  // Map nodeId -> y position
  const yMap = new Map(nodeIds.map((id, i) => [id, yOffset + i * yGap]));

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Vector Clock ({nodeIds.length} nodes, {events.length} events)
      </h3>

      <svg role="img" aria-label={`Vector Clock visualization showing ${events.length} events`} width={svgWidth} height={svgHeight} className="max-w-full overflow-x-auto">
        {/* Node timelines */}
        {nodeIds.map((id, i) => {
          const y = yMap.get(id)!;
          const color = nodeColors[i % nodeColors.length];
          return (
            <g key={id}>
              <line x1={30} y1={y} x2={svgWidth - 10} y2={y} stroke={color} strokeWidth={1.5} opacity={0.3} />
              <text x={8} y={y + 4} className="text-[10px] font-bold" fill={color}>{id}</text>
            </g>
          );
        })}

        {/* Messages (arrows between timelines) */}
        {messages.map((msg) => {
          const fromY = yMap.get(msg.from)!;
          const toY = yMap.get(msg.to)!;
          const fromX = xOffset + msg.sendTime * xScale;
          const toX = xOffset + msg.recvTime * xScale;
          return (
            <g key={msg.id}>
              <line x1={fromX} y1={fromY} x2={toX} y2={toY} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2" />
              <polygon
                points={`${toX - 4},${toY - 3} ${toX + 2},${toY} ${toX - 4},${toY + 3}`}
                fill="#f59e0b"
              />
            </g>
          );
        })}

        {/* Events */}
        {events.map((evt) => {
          const x = xOffset + evt.time * xScale;
          const y = yMap.get(evt.nodeId)!;
          const nIdx = nodeIds.indexOf(evt.nodeId);
          const color = nodeColors[nIdx % nodeColors.length];
          const hl = getHighlight(stepIdx, steps, evt.id);
          const hlColor = DS_COLORS[hl] ?? DS_COLORS.default;
          const fillColor = hl !== "default" ? hlColor : color;

          return (
            <g key={evt.id}>
              <motion.circle
                cx={x} cy={y} r={eventRadius}
                initial={false}
                animate={{
                  fill: fillColor + "40",
                  stroke: fillColor,
                  strokeWidth: hl !== "default" ? 2.5 : 2,
                }}
                transition={{ duration: ANIM_DURATION }}
              />
              <text x={x} y={y + 3} textAnchor="middle" className="text-[10px] font-bold" fill={fillColor}>
                {evt.type === "local" ? "L" : evt.type === "send" ? "S" : "R"}
              </text>
              {/* Clock vector below */}
              <text x={x} y={y + eventRadius + 10} textAnchor="middle" className="text-[10px]" fill="#9ca3af">
                [{nodeIds.map((n) => evt.clock[n] ?? 0).join(",")}]
              </text>
            </g>
          );
        })}
      </svg>

      {/* Current clocks */}
      <div className="flex gap-4">
        {nodeIds.map((id, i) => {
          const color = nodeColors[i % nodeColors.length];
          return (
            <div key={id} className="text-center">
              <div className="text-[10px] font-medium" style={{ color }}>Node {id}</div>
              <div className="font-mono text-[10px] text-foreground-muted">
                [{nodeIds.map((n) => clocks[id]?.[n] ?? 0).join(", ")}]
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export { CRDTCanvas, VectorClockCanvas };
