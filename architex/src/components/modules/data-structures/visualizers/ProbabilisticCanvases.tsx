"use client";

import React, { memo, useMemo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { DS_COLORS, dsColorBg, ANIM_DURATION, getHighlight } from "../constants";
import type { DSStep } from "@/lib/data-structures";
import type { BloomFilterState, CountMinSketchState, HyperLogLogState } from "@/lib/data-structures";
import { falsePositiveRate, cmsErrorBound, hllEstimate } from "@/lib/data-structures";

const BloomFilterCanvas = memo(function BloomFilterCanvas({
  filter,
  stepIdx,
  steps,
}: {
  filter: BloomFilterState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const fpr = falsePositiveRate(filter.k, filter.n, filter.m);
  const setBits = filter.bits.filter(Boolean).length;

  return (
    <div role="img" aria-label={`Bloom Filter visualization showing ${filter.n} elements`} className="flex flex-col items-center gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Bloom Filter (m={filter.m}, k={filter.k}, n={filter.n})
      </h3>

      {/* Bit array */}
      <div className="flex flex-wrap gap-0.5 justify-center max-w-xl">
        {filter.bits.map((bit, i) => {
          const hl = getHighlight(stepIdx, steps, `bit-${i}`);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;

          return (
            <motion.div
              key={`bit-${i}`}
              className="flex h-7 w-7 items-center justify-center rounded-sm border font-mono text-[10px] font-bold"
              initial={false}
              animate={{
                borderColor: hl !== "default" ? color : bit ? "#22c55e" : "#374151",
                backgroundColor: dsColorBg(hl, bit ? "#22c55e10" : "transparent"),
                color: hl !== "default" ? color : bit ? "#22c55e" : "var(--ds-default)",
              }}
              transition={{ duration: ANIM_DURATION }}
            >
              {bit ? "1" : "0"}
            </motion.div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Bits Set</div>
          <div className="font-mono text-sm font-medium text-foreground">{setBits}/{filter.m}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Items</div>
          <div className="font-mono text-sm font-medium text-foreground">{filter.n}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">FP Rate</div>
          <div className={cn("font-mono text-sm font-medium", fpr > 0.1 ? "text-red-400" : fpr > 0.01 ? "text-amber-400" : "text-green-400")}>
            {(fpr * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* FP Rate gauge */}
      <div className="w-full max-w-xs">
        <div className="mb-1 text-[10px] text-foreground-subtle text-center">
          False Positive Rate Gauge
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-elevated/50 border border-border/30">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            initial={false}
            animate={{
              width: `${Math.min(fpr * 100, 100)}%`,
              backgroundColor: fpr > 0.1 ? "#ef4444" : fpr > 0.01 ? "#f59e0b" : "#22c55e",
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Inserted items */}
      {filter.insertedItems.length > 0 && (
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1">Inserted</div>
          <div className="flex flex-wrap gap-1 justify-center">
            {filter.insertedItems.map((item, i) => (
              <span key={`bloom-item-${i}-${item}`} className="rounded-xl bg-elevated/50 backdrop-blur-sm border border-border/30 px-1.5 py-0.5 font-mono text-[10px] text-foreground-muted">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const CountMinSketchCanvas = memo(function CountMinSketchCanvas({
  sketch,
  stepIdx,
  steps,
}: {
  sketch: CountMinSketchState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const errBound = cmsErrorBound(sketch.w, sketch.n);
  const maxVal = Math.max(1, ...sketch.matrix.flat());

  return (
    <div role="img" aria-label={`Count-Min Sketch visualization showing ${sketch.n} elements`} className="flex flex-col items-center gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Count-Min Sketch (d={sketch.d}, w={sketch.w}, n={sketch.n})
      </h3>

      {/* 2D grid */}
      <div className="flex flex-col gap-0.5">
        {/* Column headers */}
        <div className="flex gap-0.5 ml-12">
          {Array.from({ length: sketch.w }, (_, c) => (
            <div
              key={`cms-col-${c}`}
              className="flex h-5 w-7 items-center justify-center font-mono text-[10px] text-foreground-subtle"
            >
              {c}
            </div>
          ))}
        </div>
        {sketch.matrix.map((row, r) => (
          <div key={`cms-row-${r}`} className="flex items-center gap-0.5">
            <div className="flex h-7 w-10 items-center justify-center font-mono text-[10px] text-foreground-muted">
              h{r}
            </div>
            {row.map((val, c) => {
              const hl = getHighlight(stepIdx, steps, `cell-${r}-${c}`);
              const color = DS_COLORS[hl] ?? DS_COLORS.default;
              // Color intensity based on value
              const intensity = val > 0 ? Math.min(0.2 + (val / maxVal) * 0.6, 0.8) : 0;
              const bgColor = val > 0 ? `rgba(59, 130, 246, ${intensity})` : "transparent";

              return (
                <motion.div
                  key={`cms-${r}-${c}`}
                  className="flex h-7 w-7 items-center justify-center rounded-sm border font-mono text-[10px] font-bold"
                  initial={false}
                  animate={{
                    borderColor: hl !== "default" ? color : val > 0 ? "#3b82f680" : "#374151",
                    backgroundColor: hl !== "default" ? color + "30" : bgColor,
                    color: hl !== "default" ? color : val > 0 ? "#93c5fd" : "var(--ds-default)",
                  }}
                  transition={{ duration: ANIM_DURATION }}
                >
                  {val}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Total Inserts</div>
          <div className="font-mono text-sm font-medium text-foreground">{sketch.n}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Error Bound</div>
          <div className="font-mono text-sm font-medium text-amber-400">+{errBound.toFixed(1)}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Hash Rows</div>
          <div className="font-mono text-sm font-medium text-foreground">{sketch.d}</div>
        </div>
      </div>

      {/* Tracked items */}
      {sketch.insertedItems.length > 0 && (
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1">
            Tracked Items (true counts)
          </div>
          <div className="flex flex-wrap gap-1 justify-center">
            {sketch.insertedItems.map((item, i) => (
              <span
                key={`cms-item-${i}-${item.element}`}
                className="rounded-xl bg-elevated/50 backdrop-blur-sm border border-border/30 px-1.5 py-0.5 font-mono text-[10px] text-foreground-muted"
              >
                {item.element}: {item.trueCount}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const HyperLogLogCanvas = memo(function HyperLogLogCanvas({
  hll,
  stepIdx,
  steps,
}: {
  hll: HyperLogLogState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const estimated = hllEstimate(hll.registers, hll.m);
  const actual = hll.addedElements.length;
  const maxReg = Math.max(1, ...hll.registers);
  const stdError = 1.04 / Math.sqrt(hll.m);

  return (
    <div role="img" aria-label={`HyperLogLog visualization showing ${hll.addedElements.length} elements`} className="flex flex-col items-center gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        HyperLogLog (m={hll.m} registers, p={hll.p})
      </h3>

      {/* Register array */}
      <div className="flex flex-wrap gap-0.5 justify-center max-w-xl">
        {hll.registers.map((val, i) => {
          const hl = getHighlight(stepIdx, steps, `reg-${i}`);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          const intensity = val > 0 ? Math.min(0.2 + (val / maxReg) * 0.6, 0.8) : 0;
          const bgColor = val > 0 ? `rgba(168, 85, 247, ${intensity})` : "transparent";

          return (
            <div key={`hll-reg-${i}`} className="flex flex-col items-center gap-0.5">
              <motion.div
                className="flex h-9 w-9 items-center justify-center rounded-sm border font-mono text-sm font-bold"
                initial={false}
                animate={{
                  borderColor: hl !== "default" ? color : val > 0 ? "#a855f780" : "#374151",
                  backgroundColor: hl !== "default" ? color + "30" : bgColor,
                  color: hl !== "default" ? color : val > 0 ? "#c4b5fd" : "var(--ds-default)",
                }}
                transition={{ duration: ANIM_DURATION }}
              >
                {val}
              </motion.div>
              <span className="text-[10px] font-mono text-foreground-subtle">{i}</span>
            </div>
          );
        })}
      </div>

      {/* Cardinality estimate vs actual */}
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Estimated</div>
          <div className="font-mono text-lg font-bold text-purple-400">{Math.round(estimated)}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Actual Distinct</div>
          <div className="font-mono text-lg font-bold text-green-400">{actual}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Error</div>
          <div className={cn(
            "font-mono text-lg font-bold",
            actual > 0 && Math.abs(estimated - actual) / actual > 0.3 ? "text-red-400" : "text-amber-400"
          )}>
            {actual > 0 ? ((Math.abs(estimated - actual) / actual) * 100).toFixed(1) : "0.0"}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Std Error</div>
          <div className="font-mono text-sm font-medium text-foreground-muted">{(stdError * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* Accuracy gauge */}
      <div className="w-full max-w-xs">
        <div className="mb-1 text-[10px] text-foreground-subtle text-center">
          Estimation Accuracy
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-elevated/50 border border-border/30">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            initial={false}
            animate={{
              width: actual > 0 ? `${Math.max(0, Math.min(100, 100 - (Math.abs(estimated - actual) / actual) * 100))}%` : "100%",
              backgroundColor: actual > 0 && Math.abs(estimated - actual) / actual > 0.3 ? "#ef4444" : actual > 0 && Math.abs(estimated - actual) / actual > 0.1 ? "#f59e0b" : "#22c55e",
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Added elements */}
      {hll.addedElements.length > 0 && (
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1">Added Elements</div>
          <div className="flex flex-wrap gap-1 justify-center">
            {hll.addedElements.map((item, i) => (
              <span key={`hll-elem-${i}-${item}`} className="rounded-xl bg-elevated/50 backdrop-blur-sm border border-border/30 px-1.5 py-0.5 font-mono text-[10px] text-foreground-muted">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export { BloomFilterCanvas, CountMinSketchCanvas, HyperLogLogCanvas };
