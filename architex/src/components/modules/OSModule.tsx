"use client";

import React, { memo, lazy, Suspense, useState, useCallback, useMemo, useEffect } from "react";
import {
  Cpu,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  ChevronRight,
  BarChart3,
  X,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fcfs,
  sjf,
  roundRobin,
  priorityScheduling,
  mlfq,
  compareAlgorithms,
  mlfqScheduler,
  fifoPageReplacement,
  lruPageReplacement,
  optimalPageReplacement,
  clockPageReplacement,
  generateReferenceString,
  detectDeadlock,
  bankersAlgorithm,
  simulateVirtualMemory,
  simulateMutex,
  simulateSemaphore,
  simulateReaderWriterLock,
  simulateFirstFit,
  simulateBestFit,
  simulateWorstFit,
  compareAllocAlgorithms,
} from "@/lib/os";
import type {
  Process,
  ScheduleResult,
  PageResult,
  PageEvent,
  Resource,
  ProcessState,
  DeadlockResult,
  AddressTranslation,
  SyncEvent,
  MemoryBlock,
  MemoryAllocStep,
  MemoryAllocRequest,
} from "@/lib/os";

// ── LEARN Panel Components (lazy) ────────────────────────────
const GCPauseLatencyVisualizer = lazy(() => import("@/components/modules/os/GCPauseLatencyVisualizer"));

// ── OS Concepts ─────────────────────────────────────────────

type OSConcept = "cpu-scheduling" | "page-replacement" | "deadlock" | "memory" | "mem-alloc" | "thread-sync";

interface ConceptDef {
  id: OSConcept;
  name: string;
  description: string;
}

const CONCEPTS: ConceptDef[] = [
  {
    id: "cpu-scheduling",
    name: "CPU Scheduling",
    description: "FCFS, SJF, Round Robin, Priority, MLFQ scheduling algorithms.",
  },
  {
    id: "page-replacement",
    name: "Page Replacement",
    description: "FIFO, LRU, Optimal, Clock page replacement algorithms.",
  },
  {
    id: "deadlock",
    name: "Deadlock Detection",
    description: "Resource Allocation Graph and Banker's Algorithm.",
  },
  {
    id: "memory",
    name: "Memory Management",
    description: "Virtual memory, address translation, TLB simulation.",
  },
  {
    id: "mem-alloc",
    name: "Memory Allocation",
    description: "First Fit, Best Fit, Worst Fit with fragmentation.",
  },
  {
    id: "thread-sync",
    name: "Thread Sync",
    description: "Mutex, Semaphore, Reader-Writer Lock primitives.",
  },
];

type SchedulingAlgo = "fcfs" | "sjf" | "srtf" | "rr" | "priority" | "mlfq";
type PageAlgo = "fifo" | "lru" | "optimal" | "clock";

const SCHEDULING_ALGOS: { id: SchedulingAlgo; name: string }[] = [
  { id: "fcfs", name: "First Come First Served" },
  { id: "sjf", name: "Shortest Job First" },
  { id: "srtf", name: "Shortest Remaining Time First" },
  { id: "rr", name: "Round Robin" },
  { id: "priority", name: "Priority" },
  { id: "mlfq", name: "MLFQ (3-Level)" },
];

const PAGE_ALGOS: { id: PageAlgo; name: string }[] = [
  { id: "fifo", name: "FIFO" },
  { id: "lru", name: "LRU" },
  { id: "optimal", name: "Optimal" },
  { id: "clock", name: "Clock" },
];

type SyncPrimitive = "mutex" | "semaphore" | "rw-lock";

const SYNC_PRIMITIVES: { id: SyncPrimitive; name: string }[] = [
  { id: "mutex", name: "Mutex" },
  { id: "semaphore", name: "Semaphore" },
  { id: "rw-lock", name: "Reader-Writer Lock" },
];

type AllocAlgo = "first-fit" | "best-fit" | "worst-fit";

const ALLOC_ALGOS: { id: AllocAlgo; name: string }[] = [
  { id: "first-fit", name: "First Fit" },
  { id: "best-fit", name: "Best Fit" },
  { id: "worst-fit", name: "Worst Fit" },
];

const ALLOC_COLORS: Record<string, string> = {
  P1: "#3b82f6",
  P2: "#ef4444",
  P3: "#22c55e",
  P4: "#f59e0b",
  P5: "#a855f7",
  P6: "#06b6d4",
  P7: "#f97316",
  P8: "#ec4899",
};

function getAllocColor(processId: string): string {
  return ALLOC_COLORS[processId] ?? "#8b5cf6";
}

const THREAD_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
  "#a855f7", "#06b6d4", "#f97316", "#ec4899",
  "#14b8a6", "#8b5cf6",
];

const PROCESS_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

// ── Gantt Chart ─────────────────────────────────────────────

const GanttChart = memo(function GanttChart({
  result,
  maxTick,
}: {
  result: ScheduleResult;
  maxTick?: number;
}) {
  const visibleBlocks = maxTick !== undefined
    ? result.ganttChart.filter(b => b.start < maxTick)
    : result.ganttChart;
  const maxTime = visibleBlocks.length > 0
    ? Math.max(...visibleBlocks.map((g) => g.end))
    : 0;
  const pIds = [...new Set(result.processes.map((p) => p.id))];

  return (
    <div className="w-full">
      <div className="mb-2 flex items-end gap-0.5" style={{ height: 60 }}>
        {visibleBlocks.map((block, i) => {
          const width = ((block.end - block.start) / Math.max(maxTime, 1)) * 100;
          const pIdx = block.processId ? pIds.indexOf(block.processId) : -1;
          const color = pIdx >= 0 ? PROCESS_COLORS[pIdx % PROCESS_COLORS.length] : "#374151";
          return (
            <div
              key={i}
              className="relative flex h-full items-center justify-center rounded-sm text-xs font-mono font-medium text-white"
              style={{
                width: `${width}%`,
                minWidth: 4,
                backgroundColor: color,
              }}
              title={`${block.processId ?? "idle"}: ${block.start}-${block.end}`}
            >
              {width > 3 && (
                <span className="truncate px-0.5 text-[10px]">
                  {block.processId ?? "-"}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* Time axis */}
      <div className="flex items-start justify-between text-[9px] font-mono text-foreground-subtle">
        <span>0</span>
        <span>{maxTime}</span>
      </div>
      {/* Process Color Legend */}
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {pIds.map((pid, i) => {
          const proc = result.processes.find(p => p.id === pid);
          return (
            <div key={pid} className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PROCESS_COLORS[i % PROCESS_COLORS.length] }} />
              <span className="text-[10px] font-mono text-foreground-muted">{proc?.name ?? pid}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── Mini Gantt (compact, for comparison view) ──────────────

const MiniGanttChart = memo(function MiniGanttChart({
  result,
  label,
}: {
  result: ScheduleResult;
  label: string;
}) {
  const maxTime =
    result.ganttChart.length > 0
      ? Math.max(...result.ganttChart.map((g) => g.end))
      : 0;
  const pIds = [...new Set(result.processes.map((p) => p.id))];

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-[11px] font-semibold text-foreground">{label}</span>
        <span className="text-[9px] font-mono text-foreground-subtle">
          Avg Wait: {result.avgWaitTime.toFixed(1)}
        </span>
      </div>
      <div className="flex items-end gap-0.5" style={{ height: 32 }}>
        {result.ganttChart.map((block, i) => {
          const width =
            ((block.end - block.start) / Math.max(maxTime, 1)) * 100;
          const pIdx = block.processId
            ? pIds.indexOf(block.processId)
            : -1;
          const color =
            pIdx >= 0
              ? PROCESS_COLORS[pIdx % PROCESS_COLORS.length]
              : "#374151";
          return (
            <div
              key={i}
              className="relative flex h-full items-center justify-center rounded-sm text-[8px] font-mono font-medium text-white"
              style={{
                width: `${width}%`,
                minWidth: 2,
                backgroundColor: color,
              }}
              title={`${block.processId ?? "idle"}: ${block.start}-${block.end}`}
            >
              {width > 4 && (
                <span className="truncate px-0.5">{block.processId ?? "-"}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-start justify-between text-[8px] font-mono text-foreground-subtle">
        <span>0</span>
        <span>{maxTime}</span>
      </div>
    </div>
  );
});

// ── Scheduling Comparison Panel ────────────────────────────

const SchedulingComparisonPanel = memo(function SchedulingComparisonPanel({
  comparison,
  onClose,
}: {
  comparison: Record<string, ScheduleResult>;
  onClose: () => void;
}) {
  const entries = useMemo(() => Object.entries(comparison), [comparison]);

  // Find best (lowest) for each metric
  const bestAvgWait = useMemo(
    () =>
      entries.reduce(
        (best, [name, r]) =>
          r.avgWaitTime < best.value ? { name, value: r.avgWaitTime } : best,
        { name: "", value: Infinity },
      ).name,
    [entries],
  );
  const bestAvgTAT = useMemo(
    () =>
      entries.reduce(
        (best, [name, r]) =>
          r.avgTurnaroundTime < best.value
            ? { name, value: r.avgTurnaroundTime }
            : best,
        { name: "", value: Infinity },
      ).name,
    [entries],
  );
  const bestAvgResp = useMemo(
    () =>
      entries.reduce(
        (best, [name, r]) =>
          r.avgResponseTime < best.value
            ? { name, value: r.avgResponseTime }
            : best,
        { name: "", value: Infinity },
      ).name,
    [entries],
  );
  const bestCpuUtil = useMemo(
    () =>
      entries.reduce(
        (best, [name, r]) =>
          r.cpuUtilization > best.value
            ? { name, value: r.cpuUtilization }
            : best,
        { name: "", value: -Infinity },
      ).name,
    [entries],
  );

  // Bar chart: max avg wait for scaling
  const maxAvgWait = useMemo(
    () => Math.max(...entries.map(([, r]) => r.avgWaitTime), 1),
    [entries],
  );

  return (
    <div className="flex h-full w-full flex-col bg-background p-6 overflow-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Scheduling Algorithm Comparison
        </h2>
        <button
          onClick={onClose}
          className="flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated"
        >
          <X className="h-3.5 w-3.5" /> Close
        </button>
      </div>

      {/* Stacked Gantt Charts */}
      <div className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Gantt Charts
        </h3>
        <div className="space-y-3 rounded-md border border-border bg-elevated p-3">
          {entries.map(([name, result]) => (
            <MiniGanttChart key={name} result={result} label={name} />
          ))}
        </div>
      </div>

      {/* Metrics Comparison Table */}
      <div className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Metrics Comparison
        </h3>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-elevated text-foreground-muted">
                <th className="px-3 py-2 text-left">Algorithm</th>
                <th className="px-3 py-2 text-right">Avg Wait</th>
                <th className="px-3 py-2 text-right">Avg Turnaround</th>
                <th className="px-3 py-2 text-right">Avg Response</th>
                <th className="px-3 py-2 text-right">CPU Util</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([name, r]) => (
                <tr
                  key={name}
                  className="border-b border-border/50 text-foreground"
                >
                  <td className="px-3 py-2 font-medium">{name}</td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-mono",
                      name === bestAvgWait
                        ? "text-green-400 font-semibold"
                        : "",
                    )}
                  >
                    {r.avgWaitTime.toFixed(2)}
                    {name === bestAvgWait && (
                      <span className="ml-1 text-[9px]">BEST</span>
                    )}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-mono",
                      name === bestAvgTAT
                        ? "text-green-400 font-semibold"
                        : "",
                    )}
                  >
                    {r.avgTurnaroundTime.toFixed(2)}
                    {name === bestAvgTAT && (
                      <span className="ml-1 text-[9px]">BEST</span>
                    )}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-mono",
                      name === bestAvgResp
                        ? "text-green-400 font-semibold"
                        : "",
                    )}
                  >
                    {r.avgResponseTime.toFixed(2)}
                    {name === bestAvgResp && (
                      <span className="ml-1 text-[9px]">BEST</span>
                    )}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-mono",
                      name === bestCpuUtil
                        ? "text-green-400 font-semibold"
                        : "",
                    )}
                  >
                    {(r.cpuUtilization * 100).toFixed(1)}%
                    {name === bestCpuUtil && (
                      <span className="ml-1 text-[9px]">BEST</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar Chart: Average Wait Times */}
      <div className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Average Wait Time Comparison
        </h3>
        <div className="space-y-2 rounded-md border border-border bg-elevated p-3">
          {entries.map(([name, r]) => {
            const pct = (r.avgWaitTime / maxAvgWait) * 100;
            const isBest = name === bestAvgWait;
            return (
              <div key={name} className="flex items-center gap-2">
                <span className="w-[160px] shrink-0 truncate text-[11px] font-medium text-foreground">
                  {name}
                </span>
                <div className="flex-1 h-5 rounded-full bg-background overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isBest ? "bg-green-500" : "bg-primary/70",
                    )}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "w-12 text-right font-mono text-[11px]",
                    isBest ? "text-green-400 font-semibold" : "text-foreground-muted",
                  )}
                >
                  {r.avgWaitTime.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// ── Belady's Anomaly Panel ─────────────────────────────────

interface BeladyResult {
  threeFrames: PageResult;
  fourFrames: PageResult;
}

const BeladyAnomalyPanel = memo(function BeladyAnomalyPanel({
  result,
  onClose,
}: {
  result: BeladyResult;
  onClose: () => void;
}) {
  const { threeFrames, fourFrames } = result;

  return (
    <div className="flex h-full w-full flex-col bg-background p-6 overflow-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Belady&apos;s Anomaly Demonstration
          </h2>
          <span className="flex items-center gap-1 rounded-md bg-red-500/20 px-2 py-1 text-xs font-bold text-red-400 border border-red-500/40">
            <AlertTriangle className="h-3.5 w-3.5" /> Anomaly!
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated"
        >
          <X className="h-3.5 w-3.5" /> Close
        </button>
      </div>

      {/* Reference string */}
      <div className="mb-4 rounded-md border border-border bg-elevated p-3">
        <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          Reference String
        </span>
        <p className="mt-1 font-mono text-sm text-foreground">
          1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5
        </p>
      </div>

      {/* Side-by-side comparison */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 3 Frames */}
        <div className="rounded-md border border-border bg-elevated p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground">
              FIFO with 3 Frames
            </h3>
            <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[11px] font-mono font-semibold text-blue-400">
              {threeFrames.totalFaults} faults
            </span>
          </div>
          <div className="w-full overflow-x-auto">
            <div className="inline-flex gap-1">
              {threeFrames.events.map((event, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col items-center rounded border p-1",
                    "border-border bg-surface",
                  )}
                  style={{ minWidth: 36 }}
                >
                  <span
                    className={cn(
                      "mb-1 text-xs font-mono font-medium",
                      event.hit ? "text-green-400" : "text-red-400",
                    )}
                  >
                    {event.page}
                  </span>
                  {event.frames.map((frame, fIdx) => (
                    <div
                      key={fIdx}
                      className={cn(
                        "mb-0.5 flex h-5 w-full items-center justify-center rounded-sm text-[10px] font-mono",
                        frame === event.page && !event.hit
                          ? "bg-red-500/20 text-red-400"
                          : frame === event.page && event.hit
                            ? "bg-green-500/20 text-green-400"
                            : "bg-background text-foreground-muted",
                      )}
                    >
                      {frame >= 0 ? frame : "-"}
                    </div>
                  ))}
                  <span
                    className={cn(
                      "mt-1 text-[8px] font-medium uppercase",
                      event.hit ? "text-green-400" : "text-red-400",
                    )}
                  >
                    {event.hit ? "HIT" : "FAULT"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-foreground-muted">
            <span>Hits: <span className="text-green-400">{threeFrames.totalHits}</span></span>
            <span>Faults: <span className="text-red-400">{threeFrames.totalFaults}</span></span>
            <span>Hit Rate: {(threeFrames.hitRate * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* 4 Frames */}
        <div className="rounded-md border-2 border-red-500/50 bg-red-500/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground">
              FIFO with 4 Frames
            </h3>
            <span className="rounded bg-red-500/20 px-2 py-0.5 text-[11px] font-mono font-semibold text-red-400">
              {fourFrames.totalFaults} faults
            </span>
          </div>
          <div className="w-full overflow-x-auto">
            <div className="inline-flex gap-1">
              {fourFrames.events.map((event, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col items-center rounded border p-1",
                    "border-border bg-surface",
                  )}
                  style={{ minWidth: 36 }}
                >
                  <span
                    className={cn(
                      "mb-1 text-xs font-mono font-medium",
                      event.hit ? "text-green-400" : "text-red-400",
                    )}
                  >
                    {event.page}
                  </span>
                  {event.frames.map((frame, fIdx) => (
                    <div
                      key={fIdx}
                      className={cn(
                        "mb-0.5 flex h-5 w-full items-center justify-center rounded-sm text-[10px] font-mono",
                        frame === event.page && !event.hit
                          ? "bg-red-500/20 text-red-400"
                          : frame === event.page && event.hit
                            ? "bg-green-500/20 text-green-400"
                            : "bg-background text-foreground-muted",
                      )}
                    >
                      {frame >= 0 ? frame : "-"}
                    </div>
                  ))}
                  <span
                    className={cn(
                      "mt-1 text-[8px] font-medium uppercase",
                      event.hit ? "text-green-400" : "text-red-400",
                    )}
                  >
                    {event.hit ? "HIT" : "FAULT"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-foreground-muted">
            <span>Hits: <span className="text-green-400">{fourFrames.totalHits}</span></span>
            <span>Faults: <span className="text-red-400">{fourFrames.totalFaults}</span></span>
            <span>Hit Rate: {(fourFrames.hitRate * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Visual fault count comparison */}
      <div className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Fault Count Comparison
        </h3>
        <div className="space-y-2 rounded-md border border-border bg-elevated p-3">
          <div className="flex items-center gap-2">
            <span className="w-[100px] shrink-0 text-[11px] font-medium text-foreground">
              3 Frames
            </span>
            <div className="flex-1 h-6 rounded-full bg-background overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all flex items-center justify-end pr-2"
                style={{ width: `${(threeFrames.totalFaults / Math.max(threeFrames.totalFaults, fourFrames.totalFaults)) * 100}%` }}
              >
                <span className="text-[10px] font-mono font-medium text-white">{threeFrames.totalFaults}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-[100px] shrink-0 text-[11px] font-medium text-red-400">
              4 Frames
            </span>
            <div className="flex-1 h-6 rounded-full bg-background overflow-hidden">
              <div
                className="h-full rounded-full bg-red-500 transition-all flex items-center justify-end pr-2"
                style={{ width: `${(fourFrames.totalFaults / Math.max(threeFrames.totalFaults, fourFrames.totalFaults)) * 100}%` }}
              >
                <span className="text-[10px] font-mono font-medium text-white">{fourFrames.totalFaults}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <h4 className="mb-1 text-xs font-semibold text-amber-400">
              What is Belady&apos;s Anomaly?
            </h4>
            <p className="text-xs leading-relaxed text-foreground-muted">
              Adding more frames actually increased page faults — this is Belady&apos;s Anomaly,
              unique to FIFO. With 3 frames, FIFO produces {threeFrames.totalFaults} faults, but
              with 4 frames it produces {fourFrames.totalFaults} faults. Stack-based algorithms
              like LRU and Optimal are immune to this anomaly because they satisfy the
              inclusion property: the set of pages in memory with <em>n</em> frames is always a
              subset of the set with <em>n+1</em> frames.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Page Algorithm Comparison Panel ───────────────────────────

const PageComparisonPanel = memo(function PageComparisonPanel({
  comparison,
  onClose,
}: {
  comparison: Record<string, PageResult>;
  onClose: () => void;
}) {
  const entries = useMemo(() => Object.entries(comparison), [comparison]);

  // Find best (lowest faults)
  const bestFaults = useMemo(
    () =>
      entries.reduce(
        (best, [name, r]) =>
          r.totalFaults < best.value ? { name, value: r.totalFaults } : best,
        { name: "", value: Infinity },
      ).name,
    [entries],
  );

  // Max faults for bar chart scaling
  const maxFaults = useMemo(
    () => Math.max(...entries.map(([, r]) => r.totalFaults), 1),
    [entries],
  );

  return (
    <div className="flex h-full w-full flex-col bg-background p-6 overflow-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Page Algorithm Comparison
        </h2>
        <button
          onClick={onClose}
          className="flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated"
        >
          <X className="h-3.5 w-3.5" /> Close
        </button>
      </div>

      {/* Metrics Comparison Table */}
      <div className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Algorithm Metrics
        </h3>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-elevated text-foreground-muted">
                <th className="px-3 py-2 text-left">Algorithm</th>
                <th className="px-3 py-2 text-right">Faults</th>
                <th className="px-3 py-2 text-right">Hit Rate</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([name, r]) => (
                <tr
                  key={name}
                  className="border-b border-border/50 text-foreground"
                >
                  <td className="px-3 py-2 font-medium">{name}</td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-mono",
                      name === bestFaults
                        ? "text-green-400 font-semibold"
                        : "",
                    )}
                  >
                    {r.totalFaults}
                    {name === bestFaults && (
                      <span className="ml-1 text-[9px]">BEST</span>
                    )}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-mono",
                      name === bestFaults
                        ? "text-green-400 font-semibold"
                        : "",
                    )}
                  >
                    {(r.hitRate * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar Chart: Fault Counts */}
      <div className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Page Fault Comparison
        </h3>
        <div className="space-y-2 rounded-md border border-border bg-elevated p-3">
          {entries.map(([name, r]) => {
            const pct = (r.totalFaults / maxFaults) * 100;
            const isBest = name === bestFaults;
            return (
              <div key={name} className="flex items-center gap-2">
                <span className="w-[80px] shrink-0 truncate text-[11px] font-medium text-foreground">
                  {name}
                </span>
                <div className="flex-1 h-5 rounded-full bg-background overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isBest ? "bg-green-500" : "bg-primary/70",
                    )}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "w-12 text-right font-mono text-[11px]",
                    isBest
                      ? "text-green-400 font-semibold"
                      : "text-foreground-muted",
                  )}
                >
                  {r.totalFaults}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// ── Page Frame Grid ─────────────────────────────────────────

const PageFrameGrid = memo(function PageFrameGrid({
  result,
  currentStep,
}: {
  result: PageResult;
  currentStep: number;
}) {
  const visibleEvents = result.events.slice(0, currentStep + 1);

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex gap-1">
        {visibleEvents.map((event, i) => {
          const isCurrent = i === currentStep;
          return (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center rounded border p-1 transition-colors",
                isCurrent
                  ? "border-primary bg-primary/10"
                  : "border-border bg-elevated",
              )}
              style={{ minWidth: 40 }}
            >
              {/* Referenced page */}
              <span
                className={cn(
                  "mb-1 text-xs font-mono font-medium",
                  event.hit ? "text-green-400" : "text-red-400",
                )}
              >
                {event.page}
              </span>
              {/* Frames */}
              {event.frames.map((frame, fIdx) => (
                <div
                  key={fIdx}
                  className={cn(
                    "mb-0.5 flex h-5 w-full items-center justify-center rounded-sm text-[10px] font-mono",
                    frame === event.page && !event.hit
                      ? "bg-red-500/20 text-red-400"
                      : frame === event.page && event.hit
                        ? "bg-green-500/20 text-green-400"
                        : "bg-surface text-foreground-muted",
                  )}
                >
                  {frame >= 0 ? frame : "-"}
                </div>
              ))}
              {/* Hit/Fault indicator */}
              <span
                className={cn(
                  "mt-1 text-[8px] font-medium uppercase",
                  event.hit ? "text-green-400" : "text-red-400",
                )}
              >
                {event.hit ? "HIT" : "FAULT"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── Resource Allocation Graph (SVG) ─────────────────────────

const ResourceAllocationGraph = memo(function ResourceAllocationGraph({
  processes,
  resources,
  deadlockResult,
}: {
  processes: Array<{ name: string; allocated: Record<string, number>; requested: Record<string, number> }>;
  resources: Array<{ name: string; total: number; available: number }>;
  deadlockResult: DeadlockResult;
}) {
  const deadlockedSet = new Set(deadlockResult.deadlockedProcesses);
  const cycleSet = new Set(deadlockResult.cycle ?? []);

  const pCount = processes.length;
  const rCount = resources.length;
  const width = Math.max(400, (pCount + rCount) * 80);
  const height = 220;

  // Layout: processes on top, resources on bottom
  const pPositions = processes.map((_, i) => ({
    x: (width / (pCount + 1)) * (i + 1),
    y: 50,
  }));
  const rPositions = resources.map((_, i) => ({
    x: (width / (rCount + 1)) * (i + 1),
    y: 170,
  }));

  const edges: Array<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    type: "assignment" | "request";
    inCycle: boolean;
  }> = [];

  // Assignment edges: resource -> process (resource assigned to process)
  processes.forEach((p, pi) => {
    resources.forEach((_, ri) => {
      const rid = `r${ri}`;
      if ((p.allocated[rid] ?? 0) > 0) {
        const pid = `p${pi}`;
        edges.push({
          from: rPositions[ri],
          to: pPositions[pi],
          type: "assignment",
          inCycle: deadlockedSet.has(pid) && cycleSet.has(pid),
        });
      }
    });
  });

  // Request edges: process -> resource (process requests resource)
  processes.forEach((p, pi) => {
    resources.forEach((_, ri) => {
      const rid = `r${ri}`;
      if ((p.requested[rid] ?? 0) > 0) {
        const pid = `p${pi}`;
        edges.push({
          from: pPositions[pi],
          to: rPositions[ri],
          type: "request",
          inCycle: deadlockedSet.has(pid) && cycleSet.has(pid),
        });
      }
    });
  });

  return (
    <svg width={width} height={height} className="mx-auto" role="img" aria-label="Resource Allocation Graph showing process-resource relationships">
      <defs>
        <marker id="arrow-normal" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#6b7280" />
        </marker>
        <marker id="arrow-red" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#ef4444" />
        </marker>
        <marker id="arrow-green" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#22c55e" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map((e, i) => {
        const dx = e.to.x - e.from.x;
        const dy = e.to.y - e.from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / dist;
        const ny = dy / dist;
        // Shorten line to not overlap nodes
        const startX = e.from.x + nx * 20;
        const startY = e.from.y + ny * 20;
        const endX = e.to.x - nx * 20;
        const endY = e.to.y - ny * 20;
        const color = e.inCycle ? "#ef4444" : e.type === "assignment" ? "#22c55e" : "#6b7280";
        const markerId = e.inCycle ? "arrow-red" : e.type === "assignment" ? "arrow-green" : "arrow-normal";
        return (
          <line
            key={i}
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke={color}
            strokeWidth={e.inCycle ? 2 : 1.5}
            strokeDasharray={e.type === "request" ? "4,3" : undefined}
            markerEnd={`url(#${markerId})`}
          />
        );
      })}

      {/* Process nodes (circles) */}
      {processes.map((p, i) => {
        const pid = `p${i}`;
        const isDead = deadlockedSet.has(pid);
        return (
          <g key={`p${i}`}>
            <circle
              cx={pPositions[i].x}
              cy={pPositions[i].y}
              r={18}
              fill={isDead ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)"}
              stroke={isDead ? "#ef4444" : "#3b82f6"}
              strokeWidth={isDead ? 2 : 1.5}
            />
            <text
              x={pPositions[i].x}
              y={pPositions[i].y + 4}
              textAnchor="middle"
              className="text-[11px] font-mono"
              fill={isDead ? "#ef4444" : "#3b82f6"}
            >
              {p.name}
            </text>
          </g>
        );
      })}

      {/* Resource nodes (rectangles) */}
      {resources.map((r, i) => (
        <g key={`r${i}`}>
          <rect
            x={rPositions[i].x - 18}
            y={rPositions[i].y - 14}
            width={36}
            height={28}
            rx={4}
            fill="rgba(6,182,212,0.15)"
            stroke="#06b6d4"
            strokeWidth={1.5}
          />
          <text
            x={rPositions[i].x}
            y={rPositions[i].y + 4}
            textAnchor="middle"
            className="text-[11px] font-mono"
            fill="#06b6d4"
          >
            {r.name}
          </text>
        </g>
      ))}

      {/* Legend */}
      <g transform={`translate(10, ${height - 20})`}>
        <line x1="0" y1="0" x2="16" y2="0" stroke="#22c55e" strokeWidth={1.5} />
        <text x="20" y="4" className="text-[9px]" fill="#6b7280">Assignment</text>
        <line x1="80" y1="0" x2="96" y2="0" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="4,3" />
        <text x="100" y="4" className="text-[9px]" fill="#6b7280">Request</text>
        <line x1="150" y1="0" x2="166" y2="0" stroke="#ef4444" strokeWidth={2} />
        <text x="170" y="4" className="text-[9px]" fill="#6b7280">In cycle</text>
      </g>
    </svg>
  );
});

// ── Thread Sync Visualization (SVG) ────────────────────────

const ThreadSyncCanvas = memo(function ThreadSyncCanvas({
  events,
  currentStep,
  primitive,
}: {
  events: SyncEvent[];
  currentStep: number;
  primitive: SyncPrimitive;
}) {
  const visible = events.slice(0, currentStep + 1);

  // Derive unique thread IDs
  const threadIds = useMemo(
    () => [...new Set(events.map((e) => e.threadId))],
    [events],
  );

  // Current state of each thread
  const threadStates = useMemo(() => {
    const states: Record<string, 'idle' | 'holding' | 'waiting'> = {};
    threadIds.forEach((id) => (states[id] = 'idle'));
    for (const e of visible) {
      if (e.action === 'acquire') states[e.threadId] = 'holding';
      else if (e.action === 'release' || e.action === 'signal') states[e.threadId] = 'idle';
      else if (e.action === 'blocked' || e.action === 'wait') states[e.threadId] = 'waiting';
    }
    return states;
  }, [visible, threadIds]);

  const width = Math.max(500, threadIds.length * 100 + 200);
  const height = 280;
  const centerX = width / 2;
  const centerY = 100;
  const resourceW = 80;
  const resourceH = 44;
  const threadRadius = 22;

  // Position threads in a semicircle below the resource
  const threadPositions = threadIds.map((_, i) => {
    const total = threadIds.length;
    const angleStart = Math.PI * 0.15;
    const angleEnd = Math.PI * 0.85;
    const angle = total === 1
      ? (angleStart + angleEnd) / 2
      : angleStart + (i / (total - 1)) * (angleEnd - angleStart);
    const radius = 110;
    return {
      x: centerX + Math.cos(angle) * radius - radius * Math.cos((angleStart + angleEnd) / 2),
      y: centerY + Math.sin(angle) * radius + 30,
    };
  });

  // Re-center: compute bounding box and adjust
  const minX = Math.min(...threadPositions.map((p) => p.x)) - threadRadius - 20;
  const maxX = Math.max(...threadPositions.map((p) => p.x)) + threadRadius + 20;
  const adjustedWidth = Math.max(width, maxX - minX + 40);
  const offsetX = adjustedWidth / 2 - (minX + maxX) / 2;

  const adjustedPositions = threadPositions.map((p) => ({
    x: p.x + offsetX,
    y: p.y,
  }));

  const adjustedCenterX = centerX + offsetX;

  // Primitive label
  const primLabel =
    primitive === "mutex" ? "Mutex" : primitive === "semaphore" ? "Semaphore" : "RW Lock";

  // Determine last event description for status
  const lastEvent = visible.length > 0 ? visible[visible.length - 1] : null;

  return (
    <svg width={adjustedWidth} height={height} className="mx-auto" role="img" aria-label="Thread synchronization diagram showing lock contention">
      <defs>
        <marker id="sync-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#6b7280" />
        </marker>
        <marker id="sync-arrow-green" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#22c55e" />
        </marker>
        <marker id="sync-arrow-red" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#ef4444" />
        </marker>
        <marker id="sync-arrow-amber" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#f59e0b" />
        </marker>
      </defs>

      {/* Central resource node */}
      <rect
        x={adjustedCenterX - resourceW / 2}
        y={centerY - resourceH / 2}
        width={resourceW}
        height={resourceH}
        rx={8}
        fill="rgba(6,182,212,0.15)"
        stroke="#06b6d4"
        strokeWidth={2}
      />
      <text
        x={adjustedCenterX}
        y={centerY + 4}
        textAnchor="middle"
        className="text-[12px] font-mono font-semibold"
        fill="#06b6d4"
      >
        {primLabel}
      </text>

      {/* Arrows from threads to resource */}
      {threadIds.map((tid, i) => {
        const tp = adjustedPositions[i];
        const state = threadStates[tid];
        const dx = adjustedCenterX - tp.x;
        const dy = centerY - tp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / dist;
        const ny = dy / dist;

        const startX = tp.x + nx * (threadRadius + 2);
        const startY = tp.y + ny * (threadRadius + 2);
        const endX = adjustedCenterX - nx * (resourceW / 2 + 2);
        const endY = centerY - ny * (resourceH / 2 + 2);

        if (state === 'idle') return null;

        const color = state === 'holding' ? '#22c55e' : '#f59e0b';
        const markerId = state === 'holding' ? 'sync-arrow-green' : 'sync-arrow-amber';
        const dashArray = state === 'waiting' ? '4,3' : undefined;

        return (
          <line
            key={`arrow-${tid}`}
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke={color}
            strokeWidth={1.5}
            strokeDasharray={dashArray}
            markerEnd={`url(#${markerId})`}
          />
        );
      })}

      {/* Thread nodes */}
      {threadIds.map((tid, i) => {
        const tp = adjustedPositions[i];
        const state = threadStates[tid];
        const color = THREAD_COLORS[i % THREAD_COLORS.length];
        const borderColor =
          state === 'holding'
            ? '#22c55e'
            : state === 'waiting'
              ? '#f59e0b'
              : color;
        const bgOpacity =
          state === 'holding'
            ? 'rgba(34,197,94,0.15)'
            : state === 'waiting'
              ? 'rgba(245,158,11,0.15)'
              : `${color}22`;

        return (
          <g key={tid}>
            <circle
              cx={tp.x}
              cy={tp.y}
              r={threadRadius}
              fill={bgOpacity}
              stroke={borderColor}
              strokeWidth={state === 'idle' ? 1.5 : 2}
            />
            <text
              x={tp.x}
              y={tp.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[11px] font-mono font-medium"
              fill={borderColor}
            >
              {tid}
            </text>
            {/* State badge */}
            <text
              x={tp.x}
              y={tp.y + threadRadius + 12}
              textAnchor="middle"
              className="text-[8px] font-mono uppercase"
              fill={
                state === 'holding'
                  ? '#22c55e'
                  : state === 'waiting'
                    ? '#f59e0b'
                    : '#6b7280'
              }
            >
              {state === 'holding' ? 'HOLD' : state === 'waiting' ? 'WAIT' : 'IDLE'}
            </text>
          </g>
        );
      })}

      {/* Status text */}
      {lastEvent && (
        <text
          x={adjustedWidth / 2}
          y={height - 12}
          textAnchor="middle"
          className="text-[10px] font-mono"
          fill="#9ca3af"
        >
          t={lastEvent.tick}: {lastEvent.description}
        </text>
      )}

      {/* Legend */}
      <g transform={`translate(10, ${height - 32})`}>
        <circle cx="6" cy="0" r="4" fill="rgba(34,197,94,0.3)" stroke="#22c55e" strokeWidth={1} />
        <text x="14" y="3" className="text-[8px]" fill="#6b7280">Holding</text>
        <circle cx="66" cy="0" r="4" fill="rgba(245,158,11,0.3)" stroke="#f59e0b" strokeWidth={1} />
        <text x="74" y="3" className="text-[8px]" fill="#6b7280">Waiting</text>
        <circle cx="126" cy="0" r="4" fill="rgba(107,114,128,0.15)" stroke="#6b7280" strokeWidth={1} />
        <text x="134" y="3" className="text-[8px]" fill="#6b7280">Idle</text>
      </g>
    </svg>
  );
});

// ── Sidebar ─────────────────────────────────────────────────

const OSSidebar = memo(function OSSidebar({
  active,
  onSelect,
}: {
  active: OSConcept;
  onSelect: (c: OSConcept) => void;
}) {
  return (
    <div className="flex h-full flex-col" role="navigation" aria-label="OS Concepts">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          OS Concepts
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {CONCEPTS.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            aria-current={active === c.id ? "page" : undefined}
            className={cn(
              "mb-1 w-full rounded-md px-3 py-2.5 text-left transition-colors",
              active === c.id
                ? "bg-primary/15 text-primary"
                : "text-foreground-muted hover:bg-elevated hover:text-foreground",
            )}
          >
            <span className="block text-sm font-medium">{c.name}</span>
            <span className="block text-[11px] text-foreground-subtle">
              {c.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});

// ── Properties Panel ────────────────────────────────────────

const OSProperties = memo(function OSProperties({
  active,
  schedResult,
  comparisonResults,
  pageResult,
  pageComparisonResults,
  beladyResult,
  deadlockResult,
  memoryResults,
  memoryStep,
  allocSteps,
  allocStep,
  allocCompare,
  syncEvents,
  syncStep,
  syncPrimitive,
}: {
  active: OSConcept;
  schedResult: ScheduleResult | null;
  comparisonResults: Record<string, ScheduleResult> | null;
  pageResult: PageResult | null;
  pageComparisonResults: Record<string, PageResult> | null;
  beladyResult: BeladyResult | null;
  deadlockResult: DeadlockResult | null;
  memoryResults: AddressTranslation[] | null;
  memoryStep: number;
  allocSteps: MemoryAllocStep[] | null;
  allocStep: number;
  allocCompare: Record<string, MemoryAllocStep[]> | null;
  syncEvents: SyncEvent[] | null;
  syncStep: number;
  syncPrimitive: SyncPrimitive;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Metrics
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {active === "cpu-scheduling" && comparisonResults && (() => {
          const entries = Object.entries(comparisonResults);
          const bestWait = entries.reduce((b, [n, r]) => r.avgWaitTime < b.v ? { n, v: r.avgWaitTime } : b, { n: "", v: Infinity }).n;
          const bestTAT = entries.reduce((b, [n, r]) => r.avgTurnaroundTime < b.v ? { n, v: r.avgTurnaroundTime } : b, { n: "", v: Infinity }).n;
          return (
            <div>
              <h4 className="mb-1.5 text-xs font-medium text-foreground">
                Comparison Summary
              </h4>
              <div className="space-y-2">
                <div className="rounded-md border border-green-500/40 bg-green-500/5 p-2">
                  <span className="block text-[10px] text-foreground-subtle">Best Avg Wait</span>
                  <span className="block font-mono text-sm text-green-400 font-semibold">{bestWait}</span>
                  <span className="block font-mono text-[10px] text-green-400">
                    {comparisonResults[bestWait].avgWaitTime.toFixed(2)}
                  </span>
                </div>
                <div className="rounded-md border border-green-500/40 bg-green-500/5 p-2">
                  <span className="block text-[10px] text-foreground-subtle">Best Avg TAT</span>
                  <span className="block font-mono text-sm text-green-400 font-semibold">{bestTAT}</span>
                  <span className="block font-mono text-[10px] text-green-400">
                    {comparisonResults[bestTAT].avgTurnaroundTime.toFixed(2)}
                  </span>
                </div>
                <div className="mt-2">
                  <h4 className="mb-1 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                    All Algorithms
                  </h4>
                  <div className="space-y-1">
                    {entries.map(([name, r]) => (
                      <div key={name} className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-foreground truncate mr-1">{name}</span>
                        <span className={cn(
                          name === bestWait ? "text-green-400 font-semibold" : "text-foreground-muted",
                        )}>
                          {r.avgWaitTime.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {active === "cpu-scheduling" && !comparisonResults && schedResult && (
          <div>
            <h4 className="mb-1.5 text-xs font-medium text-foreground">
              {schedResult.algorithm}
            </h4>
            <div className="space-y-2">
              <div className="rounded-md border border-border bg-elevated p-2">
                <span className="text-[10px] text-foreground-subtle">
                  CPU Utilization
                </span>
                <div className="mt-1 h-2 rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{
                      width: `${schedResult.cpuUtilization * 100}%`,
                    }}
                  />
                </div>
                <span className="mt-0.5 block text-right font-mono text-[10px] text-green-400">
                  {(schedResult.cpuUtilization * 100).toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded-md border border-border bg-elevated p-2 text-center">
                  <span className="block text-[10px] text-foreground-subtle">
                    Avg Wait
                  </span>
                  <span className="block font-mono text-sm text-foreground">
                    {schedResult.avgWaitTime.toFixed(1)}
                  </span>
                </div>
                <div className="rounded-md border border-border bg-elevated p-2 text-center">
                  <span className="block text-[10px] text-foreground-subtle">
                    Avg TAT
                  </span>
                  <span className="block font-mono text-sm text-foreground">
                    {schedResult.avgTurnaroundTime.toFixed(1)}
                  </span>
                </div>
                <div className="rounded-md border border-border bg-elevated p-2 text-center">
                  <span className="block text-[10px] text-foreground-subtle">
                    Avg Resp
                  </span>
                  <span className="block font-mono text-sm text-foreground">
                    {schedResult.avgResponseTime.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Process table */}
              <div className="mt-2">
                <h4 className="mb-1 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                  Process Table
                </h4>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-border bg-elevated text-foreground-muted">
                        <th className="px-2 py-1 text-left">PID</th>
                        <th className="px-2 py-1 text-right">Arr</th>
                        <th className="px-2 py-1 text-right">Burst</th>
                        <th className="px-2 py-1 text-right">Wait</th>
                        <th className="px-2 py-1 text-right">TAT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedResult.processes.map((p, i) => (
                        <tr
                          key={p.id}
                          className="border-b border-border/50 text-foreground"
                        >
                          <td className="px-2 py-1">
                            <span
                              className="mr-1 inline-block h-2 w-2 rounded-full"
                              style={{
                                backgroundColor:
                                  PROCESS_COLORS[
                                    i % PROCESS_COLORS.length
                                  ],
                              }}
                            />
                            {p.name}
                          </td>
                          <td className="px-2 py-1 text-right font-mono">
                            {p.arrivalTime}
                          </td>
                          <td className="px-2 py-1 text-right font-mono">
                            {p.burstTime}
                          </td>
                          <td className="px-2 py-1 text-right font-mono">
                            {p.waitTime ?? "-"}
                          </td>
                          <td className="px-2 py-1 text-right font-mono">
                            {p.turnaroundTime ?? "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {active === "page-replacement" && pageComparisonResults && (() => {
          const entries = Object.entries(pageComparisonResults);
          const bestAlgo = entries.reduce((b, [n, r]) => r.totalFaults < b.v ? { n, v: r.totalFaults } : b, { n: "", v: Infinity }).n;
          return (
            <div>
              <h4 className="mb-1.5 text-xs font-medium text-foreground">
                Comparison Summary
              </h4>
              <div className="space-y-2">
                <div className="rounded-md border border-green-500/40 bg-green-500/5 p-2">
                  <span className="block text-[10px] text-foreground-subtle">Fewest Faults</span>
                  <span className="block font-mono text-sm text-green-400 font-semibold">{bestAlgo}</span>
                  <span className="block font-mono text-[10px] text-green-400">
                    {pageComparisonResults[bestAlgo].totalFaults} faults ({(pageComparisonResults[bestAlgo].hitRate * 100).toFixed(1)}% hit rate)
                  </span>
                </div>
                <div className="mt-2">
                  <h4 className="mb-1 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                    All Algorithms
                  </h4>
                  <div className="space-y-1">
                    {entries.map(([name, r]) => (
                      <div key={name} className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-foreground truncate mr-1">{name}</span>
                        <span className={cn(
                          name === bestAlgo ? "text-green-400 font-semibold" : "text-foreground-muted",
                        )}>
                          {r.totalFaults}f / {(r.hitRate * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {active === "page-replacement" && beladyResult && (
          <div>
            <h4 className="mb-1.5 text-xs font-medium text-foreground">
              Belady&apos;s Anomaly
            </h4>
            <div className="space-y-2">
              <div className="rounded-md border border-red-500/40 bg-red-500/5 p-2">
                <span className="block text-[10px] text-foreground-subtle">3 Frames (FIFO)</span>
                <span className="block font-mono text-sm text-blue-400">
                  {beladyResult.threeFrames.totalFaults} faults
                </span>
              </div>
              <div className="rounded-md border-2 border-red-500/60 bg-red-500/10 p-2">
                <span className="block text-[10px] text-foreground-subtle">4 Frames (FIFO)</span>
                <span className="block font-mono text-sm text-red-400 font-semibold">
                  {beladyResult.fourFrames.totalFaults} faults
                </span>
                <span className="block text-[9px] text-red-400 mt-0.5">
                  MORE faults with MORE frames!
                </span>
              </div>
            </div>
          </div>
        )}

        {active === "page-replacement" && !pageComparisonResults && !beladyResult && pageResult && (
          <div>
            <h4 className="mb-1.5 text-xs font-medium text-foreground">
              {pageResult.algorithm}
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="rounded-md border border-border bg-elevated p-2 text-center">
                <span className="block text-[10px] text-foreground-subtle">
                  Page Faults
                </span>
                <span className="block font-mono text-sm text-red-400">
                  {pageResult.totalFaults}
                </span>
              </div>
              <div className="rounded-md border border-border bg-elevated p-2 text-center">
                <span className="block text-[10px] text-foreground-subtle">
                  Page Hits
                </span>
                <span className="block font-mono text-sm text-green-400">
                  {pageResult.totalHits}
                </span>
              </div>
              <div className="rounded-md border border-border bg-elevated p-2 text-center">
                <span className="block text-[10px] text-foreground-subtle">
                  Hit Rate
                </span>
                <span className="block font-mono text-sm text-foreground">
                  {(pageResult.hitRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="rounded-md border border-border bg-elevated p-2 text-center">
                <span className="block text-[10px] text-foreground-subtle">
                  Fault Rate
                </span>
                <span className="block font-mono text-sm text-foreground">
                  {(pageResult.faultRate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {active === "deadlock" && deadlockResult && (
          <div>
            <h4 className="mb-1.5 text-xs font-medium text-foreground">
              Deadlock Analysis
            </h4>
            <div className="space-y-1.5">
              <div
                className={cn(
                  "rounded-md border p-2 text-center",
                  deadlockResult.hasDeadlock
                    ? "border-red-500/40 bg-red-500/10"
                    : "border-green-500/40 bg-green-500/10",
                )}
              >
                <span className="block text-[10px] text-foreground-subtle">
                  Status
                </span>
                <span
                  className={cn(
                    "block font-mono text-sm font-semibold",
                    deadlockResult.hasDeadlock ? "text-red-400" : "text-green-400",
                  )}
                >
                  {deadlockResult.hasDeadlock ? "DEADLOCK" : "SAFE"}
                </span>
              </div>
              {deadlockResult.safeSequence && (
                <div className="rounded-md border border-border bg-elevated p-2">
                  <span className="block text-[10px] text-foreground-subtle">
                    Safe Sequence
                  </span>
                  <span className="block font-mono text-xs text-green-400">
                    {deadlockResult.safeSequence.join(" -> ")}
                  </span>
                </div>
              )}
              {deadlockResult.deadlockedProcesses.length > 0 && (
                <div className="rounded-md border border-red-500/30 bg-red-500/5 p-2">
                  <span className="block text-[10px] text-foreground-subtle">
                    Deadlocked Processes
                  </span>
                  <span className="block font-mono text-xs text-red-400">
                    {deadlockResult.deadlockedProcesses.join(", ")}
                  </span>
                </div>
              )}
              {deadlockResult.cycle && (
                <div className="rounded-md border border-red-500/30 bg-red-500/5 p-2">
                  <span className="block text-[10px] text-foreground-subtle">
                    Cycle
                  </span>
                  <span className="block font-mono text-xs text-red-400">
                    {deadlockResult.cycle.join(" -> ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {active === "memory" && memoryResults && memoryResults.length > 0 && (() => {
          const visible = memoryResults.slice(0, memoryStep + 1);
          const tlbHits = visible.filter((r) => r.tlbHit).length;
          const pageFaults = visible.filter((r) => r.pageFault).length;
          const total = visible.length;
          return (
            <div>
              <h4 className="mb-1.5 text-xs font-medium text-foreground">
                Memory Stats
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded-md border border-border bg-elevated p-2 text-center">
                  <span className="block text-[10px] text-foreground-subtle">
                    TLB Hits
                  </span>
                  <span className="block font-mono text-sm text-green-400">
                    {tlbHits}
                  </span>
                </div>
                <div className="rounded-md border border-border bg-elevated p-2 text-center">
                  <span className="block text-[10px] text-foreground-subtle">
                    Page Faults
                  </span>
                  <span className="block font-mono text-sm text-red-400">
                    {pageFaults}
                  </span>
                </div>
                <div className="rounded-md border border-border bg-elevated p-2 text-center">
                  <span className="block text-[10px] text-foreground-subtle">
                    TLB Hit Rate
                  </span>
                  <span className="block font-mono text-sm text-foreground">
                    {total > 0 ? ((tlbHits / total) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>
                <div className="rounded-md border border-border bg-elevated p-2 text-center">
                  <span className="block text-[10px] text-foreground-subtle">
                    Fault Rate
                  </span>
                  <span className="block font-mono text-sm text-foreground">
                    {total > 0 ? ((pageFaults / total) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {active === "mem-alloc" && allocSteps && allocSteps.length > 0 && (() => {
          const cur = allocSteps[allocStep];
          const freeBlocks = cur.blocks.filter((b) => b.isFree);
          const usedBlocks = cur.blocks.filter((b) => !b.isFree);
          const totalFree = freeBlocks.reduce((s, b) => s + b.size, 0);
          const totalUsed = usedBlocks.reduce((s, b) => s + b.size, 0);
          return (
            <div>
              <h4 className="mb-1.5 text-xs font-medium text-foreground">
                Allocation Stats
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded-md border border-border bg-elevated p-2 text-center">
                  <span className="block text-[10px] text-foreground-subtle">Used</span>
                  <span className="block font-mono text-sm text-green-400">{totalUsed}B</span>
                </div>
                <div className="rounded-md border border-border bg-elevated p-2 text-center">
                  <span className="block text-[10px] text-foreground-subtle">Free</span>
                  <span className="block font-mono text-sm text-blue-400">{totalFree}B</span>
                </div>
                <div className="rounded-md border border-border bg-elevated p-2 text-center">
                  <span className="block text-[10px] text-foreground-subtle">Free Blocks</span>
                  <span className="block font-mono text-sm text-foreground">{freeBlocks.length}</span>
                </div>
                <div className="rounded-md border border-border bg-elevated p-2 text-center">
                  <span className="block text-[10px] text-foreground-subtle">Fragmentation</span>
                  <span className={cn(
                    "block font-mono text-sm font-semibold",
                    cur.fragmentation > 50 ? "text-red-400" : cur.fragmentation > 25 ? "text-amber-400" : "text-green-400",
                  )}>
                    {cur.fragmentation}%
                  </span>
                </div>
              </div>
              {/* Process legend */}
              <div className="mt-2">
                <h4 className="mb-1 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                  Active Processes
                </h4>
                <div className="space-y-1">
                  {usedBlocks.map((b) => (
                    <div key={b.id} className="flex items-center gap-2 text-[10px] font-mono">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: getAllocColor(b.processId ?? '') }}
                      />
                      <span className="text-foreground">{b.processId}</span>
                      <span className="text-foreground-muted">{b.size}B @ {b.start}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {active === "mem-alloc" && allocCompare && (() => {
          const entries = Object.entries(allocCompare);
          const bestFrag = entries.reduce(
            (b, [n, steps]) => {
              const f = steps[steps.length - 1].fragmentation;
              return f < b.v ? { n, v: f } : b;
            },
            { n: "", v: Infinity },
          ).n;
          return (
            <div>
              <h4 className="mb-1.5 text-xs font-medium text-foreground">
                Comparison Summary
              </h4>
              <div className="space-y-2">
                <div className="rounded-md border border-green-500/40 bg-green-500/5 p-2">
                  <span className="block text-[10px] text-foreground-subtle">Least Fragmentation</span>
                  <span className="block font-mono text-sm text-green-400 font-semibold">{bestFrag}</span>
                  <span className="block font-mono text-[10px] text-green-400">
                    {allocCompare[bestFrag][allocCompare[bestFrag].length - 1].fragmentation}%
                  </span>
                </div>
                <div className="mt-2">
                  <h4 className="mb-1 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                    All Algorithms
                  </h4>
                  <div className="space-y-1">
                    {entries.map(([name, steps]) => {
                      const frag = steps[steps.length - 1].fragmentation;
                      return (
                        <div key={name} className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-foreground truncate mr-1">{name}</span>
                          <span className={cn(
                            name === bestFrag ? "text-green-400 font-semibold" : "text-foreground-muted",
                          )}>
                            {frag}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {active === "mem-alloc" && !allocSteps && !allocCompare && (
          <div className="text-center py-8">
            <Cpu className="mx-auto mb-2 h-8 w-8 text-foreground-subtle opacity-30" />
            <p className="text-xs text-foreground-muted">
              Run simulation to see metrics.
            </p>
          </div>
        )}

        {active === "deadlock" && !deadlockResult && (
          <div className="text-center py-8">
            <Cpu className="mx-auto mb-2 h-8 w-8 text-foreground-subtle opacity-30" />
            <p className="text-xs text-foreground-muted">
              Run detection to see metrics.
            </p>
          </div>
        )}

        {active === "memory" && (!memoryResults || memoryResults.length === 0) && (
          <div className="text-center py-8">
            <Cpu className="mx-auto mb-2 h-8 w-8 text-foreground-subtle opacity-30" />
            <p className="text-xs text-foreground-muted">
              Run simulation to see metrics.
            </p>
          </div>
        )}

        {active === "thread-sync" && syncEvents && syncEvents.length > 0 && (() => {
          const visible = syncEvents.slice(0, syncStep + 1);
          const acquires = visible.filter((e) => e.action === 'acquire').length;
          const releases = visible.filter((e) => e.action === 'release' || e.action === 'signal').length;
          const blocks = visible.filter((e) => e.action === 'blocked' || e.action === 'wait').length;
          const threadIds = [...new Set(syncEvents.map((e) => e.threadId))];

          return (
            <div>
              <h4 className="mb-1.5 text-xs font-medium text-foreground">
                {syncPrimitive === "mutex" ? "Mutex" : syncPrimitive === "semaphore" ? "Semaphore" : "RW Lock"} Stats
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded-md border border-border bg-elevated p-2 text-center">
                  <span className="block text-[10px] text-foreground-subtle">Threads</span>
                  <span className="block font-mono text-sm text-foreground">{threadIds.length}</span>
                </div>
                <div className="rounded-md border border-border bg-elevated p-2 text-center">
                  <span className="block text-[10px] text-foreground-subtle">Acquires</span>
                  <span className="block font-mono text-sm text-green-400">{acquires}</span>
                </div>
                <div className="rounded-md border border-border bg-elevated p-2 text-center">
                  <span className="block text-[10px] text-foreground-subtle">Releases</span>
                  <span className="block font-mono text-sm text-blue-400">{releases}</span>
                </div>
                <div className="rounded-md border border-border bg-elevated p-2 text-center">
                  <span className="block text-[10px] text-foreground-subtle">Blocks</span>
                  <span className="block font-mono text-sm text-amber-400">{blocks}</span>
                </div>
              </div>
              {/* Per-thread breakdown */}
              <div className="mt-2">
                <h4 className="mb-1 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                  Per-Thread Activity
                </h4>
                <div className="space-y-1">
                  {threadIds.map((tid, i) => {
                    const tEvents = visible.filter((e) => e.threadId === tid);
                    const tAcq = tEvents.filter((e) => e.action === 'acquire').length;
                    const tBlk = tEvents.filter((e) => e.action === 'blocked' || e.action === 'wait').length;
                    return (
                      <div key={tid} className="flex items-center gap-2 text-[10px] font-mono">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: THREAD_COLORS[i % THREAD_COLORS.length] }}
                        />
                        <span className="w-6 text-foreground">{tid}</span>
                        <span className="text-green-400">{tAcq} acq</span>
                        <span className="text-amber-400">{tBlk} blk</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {active === "thread-sync" && (!syncEvents || syncEvents.length === 0) && (
          <div className="text-center py-8">
            <Cpu className="mx-auto mb-2 h-8 w-8 text-foreground-subtle opacity-30" />
            <p className="text-xs text-foreground-muted">
              Run simulation to see metrics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

// ── Module Hook ─────────────────────────────────────────────

export function useOSModule() {
  const [active, setActive] = useState<OSConcept>("cpu-scheduling");
  const [schedAlgo, setSchedAlgo] = useState<SchedulingAlgo>("fcfs");
  const [rrQuantum, setRrQuantum] = useState(2);
  const [preemptive, setPreemptive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedStep, setSchedStep] = useState(-1);
  const [pageAlgo, setPageAlgo] = useState<PageAlgo>("fifo");
  const [schedResult, setSchedResult] = useState<ScheduleResult | null>(null);
  const [comparisonResults, setComparisonResults] = useState<Record<string, ScheduleResult> | null>(null);
  const [pageResult, setPageResult] = useState<PageResult | null>(null);
  const [pageStep, setPageStep] = useState(0);
  const [frameCount, setFrameCount] = useState(3);
  const [refString, setRefString] = useState("7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1");
  const [beladyResult, setBeladyResult] = useState<BeladyResult | null>(null);
  const [pageComparisonResults, setPageComparisonResults] = useState<Record<string, PageResult> | null>(null);

  const [processes, setProcesses] = useState<
    Array<{ name: string; arrival: number; burst: number; priority: number }>
  >([
    { name: "P1", arrival: 0, burst: 5, priority: 1 },
    { name: "P2", arrival: 1, burst: 3, priority: 2 },
    { name: "P3", arrival: 2, burst: 8, priority: 3 },
    { name: "P4", arrival: 3, burst: 2, priority: 1 },
  ]);

  // ── Deadlock state ───────────────────────────────────────
  const [dlProcesses, setDlProcesses] = useState<
    Array<{ name: string; allocated: Record<string, number>; requested: Record<string, number> }>
  >([
    { name: "P0", allocated: { r0: 1, r1: 0, r2: 0 }, requested: { r0: 0, r1: 1, r2: 0 } },
    { name: "P1", allocated: { r0: 0, r1: 1, r2: 0 }, requested: { r0: 0, r1: 0, r2: 1 } },
    { name: "P2", allocated: { r0: 0, r1: 0, r2: 1 }, requested: { r0: 1, r1: 0, r2: 0 } },
  ]);
  const [dlResources, setDlResources] = useState<
    Array<{ name: string; total: number; available: number }>
  >([
    { name: "R0", total: 2, available: 1 },
    { name: "R1", total: 1, available: 0 },
    { name: "R2", total: 1, available: 0 },
  ]);
  const [deadlockResult, setDeadlockResult] = useState<DeadlockResult | null>(null);
  const [bankersStep, setBankersStep] = useState(-1);
  const [dlMode, setDlMode] = useState<"detect" | "bankers">("detect");

  // ── Memory state ─────────────────────────────────────────
  const [memAddresses, setMemAddresses] = useState("0,4,8,16,32,4,12,0,48,16,8,4,32");
  const [memPageSize, setMemPageSize] = useState(16);
  const [memPhysFrames, setMemPhysFrames] = useState(4);
  const [memTlbSize, setMemTlbSize] = useState(2);
  const [memResults, setMemResults] = useState<AddressTranslation[] | null>(null);
  const [memStep, setMemStep] = useState(0);

  // ── Memory Allocation state ─────────────────────────────
  const [allocAlgo, setAllocAlgo] = useState<AllocAlgo>("first-fit");
  const [allocTotalMem, setAllocTotalMem] = useState(256);
  const [allocRequests, setAllocRequests] = useState<MemoryAllocRequest[]>([
    { type: "alloc", processId: "P1", size: 40 },
    { type: "alloc", processId: "P2", size: 60 },
    { type: "alloc", processId: "P3", size: 30 },
    { type: "dealloc", processId: "P2" },
    { type: "alloc", processId: "P4", size: 50 },
    { type: "alloc", processId: "P5", size: 20 },
    { type: "dealloc", processId: "P1" },
    { type: "alloc", processId: "P6", size: 35 },
  ]);
  const [allocSteps, setAllocSteps] = useState<MemoryAllocStep[] | null>(null);
  const [allocStep, setAllocStep] = useState(0);
  const [allocCompare, setAllocCompare] = useState<Record<string, MemoryAllocStep[]> | null>(null);

  // ── Thread Sync state ───────────────────────────────────
  const [syncPrimitive, setSyncPrimitive] = useState<SyncPrimitive>("mutex");
  const [syncThreadCount, setSyncThreadCount] = useState(4);
  const [syncPermits, setSyncPermits] = useState(2);
  const [syncReaders, setSyncReaders] = useState(3);
  const [syncWriters, setSyncWriters] = useState(2);
  const [syncEvents, setSyncEvents] = useState<SyncEvent[] | null>(null);
  const [syncStep, setSyncStep] = useState(0);
  const [syncPlaying, setSyncPlaying] = useState(false);
  const syncTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Bottom panel tab state ─────────────────────────────────
  const [osBottomTab, setOsBottomTab] = useState<"log" | "learn">("log");

  const runThreadSync = useCallback(() => {
    try {
      setError(null);
      let result: SyncEvent[];
      switch (syncPrimitive) {
        case "mutex":
          result = simulateMutex(syncThreadCount);
          break;
        case "semaphore":
          result = simulateSemaphore(syncThreadCount, syncPermits);
          break;
        case "rw-lock":
          result = simulateReaderWriterLock(syncReaders, syncWriters);
          break;
      }
      setSyncEvents(result);
      setSyncStep(0);
      setSyncPlaying(false);
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed');
    }
  }, [syncPrimitive, syncThreadCount, syncPermits, syncReaders, syncWriters]);

  // Play/pause auto-stepping
  React.useEffect(() => {
    if (syncPlaying && syncEvents && syncStep < syncEvents.length - 1) {
      syncTimerRef.current = setInterval(() => {
        setSyncStep((s) => {
          if (syncEvents && s >= syncEvents.length - 1) {
            setSyncPlaying(false);
            if (syncTimerRef.current) clearInterval(syncTimerRef.current);
            return s;
          }
          return s + 1;
        });
      }, 500);
    } else {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    }
    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [syncPlaying, syncEvents, syncStep]);

  // Clean up sync timer when active concept changes
  React.useEffect(() => {
    return () => {
      setSyncPlaying(false);
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [active]);

  const runScheduling = useCallback(() => {
    try {
      setError(null);
      const procs: Process[] = processes.map((p, i) => ({
        id: `p${i}`,
        name: p.name,
        arrivalTime: p.arrival,
        burstTime: p.burst,
        priority: p.priority,
        remainingTime: p.burst,
      }));

      let result: ScheduleResult;
      switch (schedAlgo) {
        case "fcfs":
          result = fcfs(procs);
          break;
        case "sjf":
          result = sjf(procs, preemptive);
          break;
        case "srtf":
          result = sjf(procs, true);
          break;
        case "rr":
          result = roundRobin(procs, rrQuantum);
          break;
        case "priority":
          result = priorityScheduling(procs, preemptive);
          break;
        case "mlfq":
          result = mlfqScheduler(procs, {
            queues: [
              { quantum: 4 },
              { quantum: 8 },
              { quantum: Infinity },
            ],
            boostInterval: 100,
          }).result;
          break;
      }
      setSchedResult(result);
      setSchedStep(0);
      setComparisonResults(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed');
    }
  }, [processes, schedAlgo, rrQuantum, preemptive]);

  const runComparison = useCallback(() => {
    try {
      setError(null);
      const procs: Process[] = processes.map((p, i) => ({
        id: `p${i}`,
        name: p.name,
        arrivalTime: p.arrival,
        burstTime: p.burst,
        priority: p.priority,
        remainingTime: p.burst,
      }));
      const results = compareAlgorithms(procs);
      setComparisonResults(results);
      setSchedResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed');
    }
  }, [processes]);

  const runPageReplacement = useCallback(() => {
    try {
      setError(null);
      let refs = refString
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      refs = refs.slice(0, 200);

      if (refs.length === 0) {
        setError('Enter at least one page number');
        return;
      }

      let result: PageResult;
      switch (pageAlgo) {
        case "fifo":
          result = fifoPageReplacement(refs, frameCount);
          break;
        case "lru":
          result = lruPageReplacement(refs, frameCount);
          break;
        case "optimal":
          result = optimalPageReplacement(refs, frameCount);
          break;
        case "clock":
          result = clockPageReplacement(refs, frameCount);
          break;
      }
      setPageResult(result);
      setPageStep(0);
      setBeladyResult(null);
      setPageComparisonResults(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed');
    }
  }, [refString, frameCount, pageAlgo]);

  const runBeladyAnomaly = useCallback(() => {
    try {
      setError(null);
      const beladyRefString = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
      const threeFrames = fifoPageReplacement(beladyRefString, 3);
      const fourFrames = fifoPageReplacement(beladyRefString, 4);
      setBeladyResult({ threeFrames, fourFrames });
      setPageResult(null);
      setPageComparisonResults(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed');
    }
  }, []);

  const runPageComparison = useCallback(() => {
    try {
      setError(null);
      const refs = refString
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      if (refs.length === 0) {
        setError('Enter at least one page number');
        return;
      }

      const results: Record<string, PageResult> = {
        FIFO: fifoPageReplacement(refs, frameCount),
        LRU: lruPageReplacement(refs, frameCount),
        Optimal: optimalPageReplacement(refs, frameCount),
        Clock: clockPageReplacement(refs, frameCount),
      };
      setPageComparisonResults(results);
      setPageResult(null);
      setBeladyResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed');
    }
  }, [refString, frameCount]);

  const addProcess = useCallback(() => {
    if (processes.length >= 20) return;
    const n = processes.length + 1;
    setProcesses((prev) => [
      ...prev,
      { name: `P${n}`, arrival: n, burst: Math.floor(Math.random() * 8) + 1, priority: n },
    ]);
  }, [processes.length]);

  const removeProcess = useCallback((idx: number) => {
    setProcesses((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // ── Deadlock actions ─────────────────────────────────────
  const resourceIds = useMemo(() => dlResources.map((_, i) => `r${i}`), [dlResources]);

  const runDeadlockDetection = useCallback(() => {
    try {
      setError(null);
      const procs: ProcessState[] = dlProcesses.map((p, i) => ({
        id: `p${i}`,
        name: p.name,
        allocated: { ...p.allocated },
        requested: { ...p.requested },
      }));
      const res: Resource[] = dlResources.map((r, i) => ({
        id: `r${i}`,
        name: r.name,
        totalInstances: r.total,
        availableInstances: r.available,
      }));
      const result = detectDeadlock(procs, res);
      setDeadlockResult(result);
      setBankersStep(-1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed');
    }
  }, [dlProcesses, dlResources]);

  const runBankers = useCallback(() => {
    try {
      setError(null);
      const procs: ProcessState[] = dlProcesses.map((p, i) => ({
        id: `p${i}`,
        name: p.name,
        allocated: { ...p.allocated },
        requested: {},
      }));
      const res: Resource[] = dlResources.map((r, i) => ({
        id: `r${i}`,
        name: r.name,
        totalInstances: r.total,
        availableInstances: r.available,
      }));
      // For Banker's, "requested" in our UI represents max need
      const maxNeed: Record<string, Record<string, number>> = {};
      dlProcesses.forEach((p, i) => {
        const pid = `p${i}`;
        maxNeed[pid] = {};
        resourceIds.forEach((rid) => {
          maxNeed[pid][rid] = (p.allocated[rid] ?? 0) + (p.requested[rid] ?? 0);
        });
      });
      const result = bankersAlgorithm(procs, res, maxNeed);
      setDeadlockResult(result);
      setBankersStep(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed');
    }
  }, [dlProcesses, dlResources, resourceIds]);

  const addDlProcess = useCallback(() => {
    const n = dlProcesses.length;
    const alloc: Record<string, number> = {};
    const req: Record<string, number> = {};
    resourceIds.forEach((rid) => { alloc[rid] = 0; req[rid] = 0; });
    setDlProcesses((prev) => [...prev, { name: `P${n}`, allocated: alloc, requested: req }]);
  }, [dlProcesses.length, resourceIds]);

  const addDlResource = useCallback(() => {
    const n = dlResources.length;
    const newRid = `r${n}`;
    setDlResources((prev) => [...prev, { name: `R${n}`, total: 1, available: 1 }]);
    setDlProcesses((prev) =>
      prev.map((p) => ({
        ...p,
        allocated: { ...p.allocated, [newRid]: 0 },
        requested: { ...p.requested, [newRid]: 0 },
      })),
    );
  }, [dlResources.length]);

  // ── Memory actions ───────────────────────────────────────
  const runMemorySimulation = useCallback(() => {
    try {
      setError(null);
      const addrs = memAddresses
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      if (addrs.length === 0) {
        setError('Enter at least one address');
        return;
      }
      const results = simulateVirtualMemory(addrs, memPageSize, memPhysFrames, memTlbSize);
      setMemResults(results);
      setMemStep(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed');
    }
  }, [memAddresses, memPageSize, memPhysFrames, memTlbSize]);

  // ── Memory Allocation actions ────────────────────────────
  const runAllocSimulation = useCallback(() => {
    try {
      setError(null);
      let steps: MemoryAllocStep[];
      switch (allocAlgo) {
        case "first-fit":
          steps = simulateFirstFit(allocTotalMem, allocRequests);
          break;
        case "best-fit":
          steps = simulateBestFit(allocTotalMem, allocRequests);
          break;
        case "worst-fit":
          steps = simulateWorstFit(allocTotalMem, allocRequests);
          break;
      }
      setAllocSteps(steps);
      setAllocStep(0);
      setAllocCompare(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed');
    }
  }, [allocAlgo, allocTotalMem, allocRequests]);

  const runAllocComparison = useCallback(() => {
    try {
      setError(null);
      const results = compareAllocAlgorithms(allocTotalMem, allocRequests);
      setAllocCompare(results);
      setAllocSteps(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed');
    }
  }, [allocTotalMem, allocRequests]);

  const addAllocRequest = useCallback((type: 'alloc' | 'dealloc') => {
    if (allocRequests.length >= 30) return;
    const existingProcessIds = allocRequests
      .filter((r) => r.type === 'alloc')
      .map((r) => r.processId);
    const nextNum = existingProcessIds.length + 1;
    if (type === 'alloc') {
      setAllocRequests((prev) => [...prev, { type: 'alloc', processId: `P${nextNum}`, size: 30 }]);
    } else {
      const lastAlloc = [...allocRequests].reverse().find((r) => r.type === 'alloc');
      setAllocRequests((prev) => [...prev, { type: 'dealloc', processId: lastAlloc?.processId ?? 'P1' }]);
    }
  }, [allocRequests]);

  const removeAllocRequest = useCallback((idx: number) => {
    setAllocRequests((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateAllocRequest = useCallback(
    (idx: number, field: string, value: string | number) => {
      setAllocRequests((prev) =>
        prev.map((r, i) => {
          if (i !== idx) return r;
          if (field === 'type') return { ...r, type: value as 'alloc' | 'dealloc' };
          if (field === 'processId') return { ...r, processId: value as string };
          if (field === 'size') return { ...r, size: value as number };
          return r;
        }),
      );
    },
    [],
  );

  // Clear error when active concept changes
  useEffect(() => { setError(null); }, [active]);

  // ── Keyboard shortcuts (Task 5) ──────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter: Run current simulation
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (active === 'cpu-scheduling') runScheduling();
        else if (active === 'page-replacement') runPageReplacement();
        else if (active === 'deadlock') runDeadlockDetection();
        else if (active === 'memory') runMemorySimulation();
        else if (active === 'mem-alloc') runAllocSimulation();
        else if (active === 'thread-sync') runThreadSync();
      }
      // ArrowRight: Step forward (only when not in an input/textarea)
      if (e.key === 'ArrowRight' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) {
        e.preventDefault();
        if (active === 'cpu-scheduling' && schedResult && schedStep >= 0) {
          setSchedStep(s => Math.min(s + 1, schedResult.events.length - 1));
        } else if (active === 'page-replacement' && pageResult) {
          setPageStep(s => Math.min(s + 1, pageResult.events.length - 1));
        } else if (active === 'memory' && memResults) {
          setMemStep(s => Math.min(s + 1, memResults.length - 1));
        } else if (active === 'mem-alloc' && allocSteps) {
          setAllocStep(s => Math.min(s + 1, allocSteps.length - 1));
        } else if (active === 'thread-sync' && syncEvents) {
          setSyncStep(s => Math.min(s + 1, syncEvents.length - 1));
        } else if (active === 'deadlock' && deadlockResult && bankersStep >= 0) {
          setBankersStep(s => Math.min(s + 1, deadlockResult.events.length - 1));
        }
      }
      // ArrowLeft: Step backward
      if (e.key === 'ArrowLeft' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) {
        e.preventDefault();
        if (active === 'cpu-scheduling' && schedResult && schedStep >= 0) {
          setSchedStep(s => Math.max(s - 1, 0));
        } else if (active === 'page-replacement' && pageResult) {
          setPageStep(s => Math.max(s - 1, 0));
        } else if (active === 'memory' && memResults) {
          setMemStep(s => Math.max(s - 1, 0));
        } else if (active === 'mem-alloc' && allocSteps) {
          setAllocStep(s => Math.max(s - 1, 0));
        } else if (active === 'thread-sync' && syncEvents) {
          setSyncStep(s => Math.max(s - 1, 0));
        } else if (active === 'deadlock' && deadlockResult && bankersStep >= 0) {
          setBankersStep(s => Math.max(s - 1, 0));
        }
      }
      // Escape: Reset step to 0
      if (e.key === 'Escape') {
        if (active === 'cpu-scheduling') setSchedStep(0);
        else if (active === 'page-replacement') setPageStep(0);
        else if (active === 'memory') setMemStep(0);
        else if (active === 'mem-alloc') setAllocStep(0);
        else if (active === 'thread-sync') { setSyncStep(0); setSyncPlaying(false); }
        else if (active === 'deadlock') setBankersStep(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, runScheduling, runPageReplacement, runDeadlockDetection, runMemorySimulation, runAllocSimulation, runThreadSync, schedResult, schedStep, pageResult, memResults, allocSteps, syncEvents, deadlockResult, bankersStep]);

  // Canvas content depends on concept
  let canvas: React.ReactNode;
  if (active === "cpu-scheduling") {
    canvas = (
      <div className="flex h-full w-full flex-col bg-background p-6">
        {error && (
          <div className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="sched-algo" className="mb-1 block text-xs font-medium text-foreground-muted">
              Algorithm
            </label>
            <select
              id="sched-algo"
              value={schedAlgo}
              onChange={(e) => setSchedAlgo(e.target.value as SchedulingAlgo)}
              className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              {SCHEDULING_ALGOS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          {schedAlgo === "rr" && (
            <div>
              <label htmlFor="sched-quantum" className="mb-1 block text-xs font-medium text-foreground-muted">Quantum</label>
              <input id="sched-quantum" type="number" min={1} max={20} value={rrQuantum} onChange={(e) => setRrQuantum(+e.target.value)}
                className="h-8 w-16 rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
            </div>
          )}
          {(schedAlgo === "sjf" || schedAlgo === "priority") && (
            <label htmlFor="sched-preemptive" className="flex items-center gap-1.5 text-sm text-foreground">
              <input id="sched-preemptive" type="checkbox" checked={preemptive} onChange={(e) => setPreemptive(e.target.checked)} />
              Preemptive
            </label>
          )}
          <button
            onClick={runScheduling}
            className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Play className="h-3.5 w-3.5" /> Run
          </button>
          <button
            onClick={runComparison}
            className="flex h-8 items-center gap-1.5 rounded-md border border-primary/60 bg-primary/10 px-3 text-sm font-medium text-primary hover:bg-primary/20"
          >
            <BarChart3 className="h-3.5 w-3.5" /> Compare All
          </button>
          <button
            onClick={addProcess}
            className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-elevated"
          >
            <Plus className="h-3.5 w-3.5" /> Add Process
          </button>
        </div>

        {/* Process inputs */}
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {processes.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md border border-border bg-elevated p-2"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{
                  backgroundColor: PROCESS_COLORS[i % PROCESS_COLORS.length],
                }}
              />
              <div className="flex-1 space-y-1">
                <label htmlFor={`proc-name-${i}`} className="sr-only">Process {i + 1} name</label>
                <input
                  id={`proc-name-${i}`}
                  className="h-5 w-full rounded border border-border bg-background px-1 font-mono text-[10px] text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                  value={p.name}
                  onChange={(e) => {
                    const next = [...processes];
                    next[i] = { ...next[i], name: e.target.value };
                    setProcesses(next);
                  }}
                />
                <div className="flex gap-1 text-[9px] text-foreground-subtle">
                  <label htmlFor={`proc-arr-${i}`}>Arr:</label>
                  <input
                    id={`proc-arr-${i}`}
                    type="number"
                    max={1000}
                    className="h-4 w-10 rounded border border-border bg-background px-0.5 font-mono text-[9px] text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                    value={p.arrival}
                    onChange={(e) => {
                      const next = [...processes];
                      next[i] = { ...next[i], arrival: +e.target.value };
                      setProcesses(next);
                    }}
                  />
                  <label htmlFor={`proc-burst-${i}`}>Burst:</label>
                  <input
                    id={`proc-burst-${i}`}
                    type="number"
                    max={1000}
                    className="h-4 w-10 rounded border border-border bg-background px-0.5 font-mono text-[9px] text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                    value={p.burst}
                    onChange={(e) => {
                      const next = [...processes];
                      next[i] = { ...next[i], burst: +e.target.value };
                      setProcesses(next);
                    }}
                  />
                </div>
                <div className="flex gap-1 text-[9px] text-foreground-subtle">
                  <label htmlFor={`proc-pri-${i}`}>Pri:</label>
                  <input
                    id={`proc-pri-${i}`}
                    type="number"
                    min={0}
                    className="h-4 w-10 rounded border border-border bg-background px-0.5 font-mono text-[9px] text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                    value={p.priority}
                    onChange={(e) => {
                      const next = [...processes];
                      next[i] = { ...next[i], priority: +e.target.value };
                      setProcesses(next);
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => removeProcess(i)}
                className="text-foreground-subtle hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Comparison Panel or Gantt Chart */}
        {comparisonResults ? (
          <div className="flex-1 overflow-auto" aria-live="polite">
            <SchedulingComparisonPanel
              comparison={comparisonResults}
              onClose={() => setComparisonResults(null)}
            />
          </div>
        ) : schedResult ? (
          <div className="flex-1" aria-live="polite">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Gantt Chart
            </h3>
            <GanttChart result={schedResult} maxTick={schedStep >= 0 && schedStep < schedResult.events.length ? schedResult.events[schedStep].tick : undefined} />
            {/* Step controls (Task 4) */}
            {schedStep >= 0 && (
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => setSchedStep(0)} className="flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated">
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
                <button onClick={() => setSchedStep(s => Math.min(s + 1, schedResult.events.length - 1))}
                  disabled={schedStep >= schedResult.events.length - 1}
                  className="flex h-7 items-center gap-1 rounded bg-primary px-2 text-xs text-white hover:bg-primary/90 disabled:opacity-40">
                  Step
                </button>
                <button onClick={() => setSchedStep(-1)} className="flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated">
                  Show All
                </button>
                <span className="ml-2 font-mono text-[10px] text-foreground-subtle">
                  {schedStep + 1}/{schedResult.events.length}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <Cpu className="h-10 w-10 text-foreground-subtle opacity-20" />
            <p className="text-sm text-foreground-muted">How does the OS decide which program runs next?</p>
            <button onClick={runScheduling} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              <Play className="h-3.5 w-3.5" /> Run FCFS
            </button>
            <button onClick={runComparison} className="text-xs text-primary hover:underline">
              or Compare All algorithms
            </button>
          </div>
        )}
      </div>
    );
  } else if (active === "page-replacement") {
    canvas = (
      <div className="flex h-full w-full flex-col bg-background p-6">
        {error && (
          <div className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="page-algo" className="mb-1 block text-xs font-medium text-foreground-muted">
              Algorithm
            </label>
            <select
              id="page-algo"
              value={pageAlgo}
              onChange={(e) => setPageAlgo(e.target.value as PageAlgo)}
              className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              {PAGE_ALGOS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="page-frames" className="mb-1 block text-xs font-medium text-foreground-muted">
              Frames
            </label>
            <input
              id="page-frames"
              type="number"
              min={1}
              max={10}
              value={frameCount}
              onChange={(e) => setFrameCount(+e.target.value)}
              className="h-8 w-16 rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="page-refstring" className="mb-1 block text-xs font-medium text-foreground-muted">
              Reference String
            </label>
            <input
              id="page-refstring"
              value={refString}
              onChange={(e) => setRefString(e.target.value)}
              className="h-8 w-full rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="7,0,1,2,0,3..."
            />
          </div>
          <button
            onClick={runPageReplacement}
            className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Play className="h-3.5 w-3.5" /> Run
          </button>
          <button
            onClick={runPageComparison}
            className="flex h-8 items-center gap-1.5 rounded-md border border-primary/60 bg-primary/10 px-3 text-sm font-medium text-primary hover:bg-primary/20"
          >
            <BarChart3 className="h-3.5 w-3.5" /> Compare All
          </button>
          <button
            onClick={runBeladyAnomaly}
            className="flex h-8 items-center gap-1.5 rounded-md border border-red-500/60 bg-red-500/10 px-3 text-sm font-medium text-red-400 hover:bg-red-500/20"
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Belady&apos;s Anomaly
          </button>
        </div>

        {/* Step controls */}
        {pageResult && (
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => setPageStep(0)}
              className="flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
            <button
              onClick={() =>
                setPageStep((s) => Math.min(s + 1, pageResult.events.length - 1))
              }
              disabled={pageStep >= pageResult.events.length - 1}
              className="flex h-7 items-center gap-1 rounded bg-primary px-2 text-xs text-white hover:bg-primary/90 disabled:opacity-40"
            >
              Step
            </button>
            <button
              onClick={() => setPageStep(pageResult.events.length - 1)}
              className="flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated"
            >
              Show All
            </button>
            <span className="ml-2 font-mono text-[10px] text-foreground-subtle">
              {pageStep + 1}/{pageResult.events.length}
            </span>
          </div>
        )}

        {/* Belady's Anomaly Panel */}
        {beladyResult ? (
          <div className="flex-1 overflow-auto" aria-live="polite">
            <BeladyAnomalyPanel
              result={beladyResult}
              onClose={() => setBeladyResult(null)}
            />
          </div>
        ) : pageComparisonResults ? (
          <div className="flex-1 overflow-auto" aria-live="polite">
            <PageComparisonPanel
              comparison={pageComparisonResults}
              onClose={() => setPageComparisonResults(null)}
            />
          </div>
        ) : pageResult ? (
          <div className="flex-1 overflow-auto" aria-live="polite">
            <PageFrameGrid result={pageResult} currentStep={pageStep} />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <Cpu className="h-10 w-10 text-foreground-subtle opacity-20" />
            <p className="text-sm text-foreground-muted">When memory is full, which page gets evicted?</p>
            <button onClick={runPageReplacement} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              <Play className="h-3.5 w-3.5" /> Run FIFO
            </button>
            <button onClick={runBeladyAnomaly} className="text-xs text-primary hover:underline">
              Show Belady&apos;s Anomaly
            </button>
          </div>
        )}
      </div>
    );
  } else if (active === "deadlock") {
    canvas = (
      <div className="flex h-full w-full flex-col bg-background p-6 overflow-auto">
        {error && (
          <div className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <button
            onClick={() => { setDlMode("detect"); runDeadlockDetection(); }}
            className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Play className="h-3.5 w-3.5" /> Detect Deadlock
          </button>
          <button
            onClick={() => { setDlMode("bankers"); runBankers(); }}
            className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-elevated"
          >
            <Play className="h-3.5 w-3.5" /> Run Banker&apos;s
          </button>
          <button
            onClick={addDlProcess}
            className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-elevated"
          >
            <Plus className="h-3.5 w-3.5" /> Process
          </button>
          <button
            onClick={addDlResource}
            className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-elevated"
          >
            <Plus className="h-3.5 w-3.5" /> Resource
          </button>
        </div>

        {/* Resource table */}
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Resources
          </h3>
          <div className="flex flex-wrap gap-2">
            {dlResources.map((r, ri) => (
              <div key={ri} className="rounded-md border border-border bg-elevated p-2 min-w-[120px]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-5 w-5 rounded border border-cyan-500/50 bg-cyan-500/10 flex items-center justify-center text-[9px] font-mono text-cyan-400">
                    {r.name}
                  </div>
                  <button
                    onClick={() => {
                      const rid = `r${ri}`;
                      setDlResources((prev) => prev.filter((_, i) => i !== ri));
                      setDlProcesses((prev) =>
                        prev.map((p) => {
                          const a = { ...p.allocated };
                          const q = { ...p.requested };
                          delete a[rid];
                          delete q[rid];
                          return { ...p, allocated: a, requested: q };
                        }),
                      );
                    }}
                    className="ml-auto text-foreground-subtle hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex gap-2 text-[9px]">
                  <div>
                    <label htmlFor={`dl-res-total-${ri}`} className="text-foreground-subtle">Total:</label>
                    <input
                      id={`dl-res-total-${ri}`}
                      type="number"
                      min={0}
                      className="ml-1 h-4 w-8 rounded border border-border bg-background px-0.5 font-mono text-[9px] text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                      value={r.total}
                      onChange={(e) => {
                        const next = [...dlResources];
                        next[ri] = { ...next[ri], total: +e.target.value };
                        setDlResources(next);
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor={`dl-res-avail-${ri}`} className="text-foreground-subtle">Avail:</label>
                    <input
                      id={`dl-res-avail-${ri}`}
                      type="number"
                      min={0}
                      className="ml-1 h-4 w-8 rounded border border-border bg-background px-0.5 font-mono text-[9px] text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                      value={r.available}
                      onChange={(e) => {
                        const next = [...dlResources];
                        next[ri] = { ...next[ri], available: +e.target.value };
                        setDlResources(next);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Allocation + Request matrices */}
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Allocation matrix */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Allocation Matrix
            </h3>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-border bg-elevated text-foreground-muted">
                    <th className="px-2 py-1 text-left">Process</th>
                    {dlResources.map((r, ri) => (
                      <th key={ri} className="px-2 py-1 text-center">{r.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dlProcesses.map((p, pi) => (
                    <tr key={pi} className="border-b border-border/50">
                      <td className="px-2 py-1 font-medium text-foreground">
                        <div className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: PROCESS_COLORS[pi % PROCESS_COLORS.length] }} />
                          {p.name}
                        </div>
                      </td>
                      {dlResources.map((_, ri) => {
                        const rid = `r${ri}`;
                        return (
                          <td key={ri} className="px-2 py-1 text-center">
                            <input
                              type="number"
                              min={0}
                              className="h-5 w-8 rounded border border-border bg-background px-0.5 text-center font-mono text-[10px] text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                              value={p.allocated[rid] ?? 0}
                              onChange={(e) => {
                                const next = [...dlProcesses];
                                next[pi] = { ...next[pi], allocated: { ...next[pi].allocated, [rid]: +e.target.value } };
                                setDlProcesses(next);
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Request (Need) matrix */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              {dlMode === "detect" ? "Current Requests" : "Maximum Additional Need"}
            </h3>
            <p className="mb-2 text-[10px] text-foreground-subtle">{dlMode === "detect" ? "Resources each process is currently requesting" : "Additional resources each process may need (Max - Allocated)"}</p>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-border bg-elevated text-foreground-muted">
                    <th className="px-2 py-1 text-left">Process</th>
                    {dlResources.map((r, ri) => (
                      <th key={ri} className="px-2 py-1 text-center">{r.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dlProcesses.map((p, pi) => (
                    <tr key={pi} className="border-b border-border/50">
                      <td className="px-2 py-1 font-medium text-foreground">
                        <div className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: PROCESS_COLORS[pi % PROCESS_COLORS.length] }} />
                          {p.name}
                        </div>
                      </td>
                      {dlResources.map((_, ri) => {
                        const rid = `r${ri}`;
                        return (
                          <td key={ri} className="px-2 py-1 text-center">
                            <input
                              type="number"
                              min={0}
                              className="h-5 w-8 rounded border border-border bg-background px-0.5 text-center font-mono text-[10px] text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                              value={p.requested[rid] ?? 0}
                              onChange={(e) => {
                                const next = [...dlProcesses];
                                next[pi] = { ...next[pi], requested: { ...next[pi].requested, [rid]: +e.target.value } };
                                setDlProcesses(next);
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Resource Allocation Graph (SVG) */}
        {deadlockResult && (
          <div className="mb-4" aria-live="polite">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Resource Allocation Graph
            </h3>
            <div className="rounded-md border border-border bg-elevated p-4 overflow-auto">
              <ResourceAllocationGraph
                processes={dlProcesses}
                resources={dlResources}
                deadlockResult={deadlockResult}
              />
            </div>
          </div>
        )}

        {/* Banker's step-through */}
        {deadlockResult && bankersStep >= 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Banker&apos;s Algorithm Steps
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setBankersStep(0)}
                className="flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
              <button
                onClick={() => setBankersStep((s) => Math.min(s + 1, deadlockResult.events.length - 1))}
                disabled={bankersStep >= deadlockResult.events.length - 1}
                className="flex h-7 items-center gap-1 rounded bg-primary px-2 text-xs text-white hover:bg-primary/90 disabled:opacity-40"
              >
                Step
              </button>
              <button
                onClick={() => setBankersStep(deadlockResult.events.length - 1)}
                className="flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated"
              >
                Show All
              </button>
              <span className="ml-2 font-mono text-[10px] text-foreground-subtle">
                {bankersStep + 1}/{deadlockResult.events.length}
              </span>
            </div>
            <div className="space-y-1 max-h-40 overflow-auto rounded-md border border-border bg-surface p-2">
              {deadlockResult.events.slice(0, bankersStep + 1).map((e, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2 py-0.5 text-[10px] font-mono",
                    e.type === "safe" ? "text-green-400" :
                    e.type === "deadlock-detected" ? "text-red-400" :
                    e.type === "release" ? "text-blue-400" :
                    "text-foreground-muted",
                  )}
                >
                  <span className="w-6 shrink-0 text-foreground-subtle">
                    {e.tick}
                  </span>
                  <span>{e.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!deadlockResult && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <Cpu className="h-10 w-10 text-foreground-subtle opacity-20" />
            <p className="text-sm text-foreground-muted">Two processes each hold resources the other needs.</p>
            <button onClick={() => { setDlMode("detect"); runDeadlockDetection(); }} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              <Play className="h-3.5 w-3.5" /> Detect Deadlock
            </button>
          </div>
        )}
      </div>
    );
  } else if (active === "memory") {
    canvas = (
      <div className="flex h-full w-full flex-col bg-background p-6 overflow-auto">
        {error && (
          <div className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label htmlFor="mem-addresses" className="mb-1 block text-xs font-medium text-foreground-muted">
              Virtual Addresses (comma-separated)
            </label>
            <input
              id="mem-addresses"
              value={memAddresses}
              onChange={(e) => setMemAddresses(e.target.value)}
              className="h-8 w-full rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="0,4,8,16..."
            />
          </div>
          <div>
            <label htmlFor="mem-pagesize" className="mb-1 block text-xs font-medium text-foreground-muted">
              Page Size
            </label>
            <select
              id="mem-pagesize"
              value={memPageSize}
              onChange={(e) => setMemPageSize(+e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              {[4, 8, 16, 32, 64].map((s) => (
                <option key={s} value={s}>{s}B</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="mem-physframes" className="mb-1 block text-xs font-medium text-foreground-muted">
              Phys Frames
            </label>
            <input
              id="mem-physframes"
              type="number"
              min={1}
              max={16}
              value={memPhysFrames}
              onChange={(e) => setMemPhysFrames(+e.target.value)}
              className="h-8 w-16 rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="mem-tlbsize" className="mb-1 block text-xs font-medium text-foreground-muted">
              TLB Size
            </label>
            <input
              id="mem-tlbsize"
              type="number"
              min={1}
              max={8}
              value={memTlbSize}
              onChange={(e) => setMemTlbSize(+e.target.value)}
              className="h-8 w-16 rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <button
            onClick={runMemorySimulation}
            className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Play className="h-3.5 w-3.5" /> Run
          </button>
        </div>

        {/* Step controls */}
        {memResults && memResults.length > 0 && (
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => setMemStep(0)}
              className="flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
            <button
              onClick={() => setMemStep((s) => Math.min(s + 1, memResults!.length - 1))}
              disabled={memStep >= memResults.length - 1}
              className="flex h-7 items-center gap-1 rounded bg-primary px-2 text-xs text-white hover:bg-primary/90 disabled:opacity-40"
            >
              Translate
            </button>
            <button
              onClick={() => setMemStep(memResults!.length - 1)}
              className="flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated"
            >
              Show All
            </button>
            <span className="ml-2 font-mono text-[10px] text-foreground-subtle">
              {memStep + 1}/{memResults.length}
            </span>
          </div>
        )}

        {/* Translation results */}
        {memResults && memResults.length > 0 ? (
          <div className="flex-1 overflow-auto space-y-4" aria-live="polite">
            {/* Current translation detail */}
            {(() => {
              const cur = memResults[memStep];
              return (
                <div
                  className={cn(
                    "rounded-md border p-3",
                    cur.tlbHit
                      ? "border-green-500/40 bg-green-500/5"
                      : cur.pageFault
                        ? "border-red-500/40 bg-red-500/5"
                        : "border-blue-500/40 bg-blue-500/5",
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-foreground">Address Translation</span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium",
                        cur.tlbHit ? "bg-green-500/20 text-green-400" :
                        cur.pageFault ? "bg-red-500/20 text-red-400" :
                        "bg-blue-500/20 text-blue-400",
                      )}
                    >
                      {cur.tlbHit ? "TLB HIT" : cur.pageFault ? "PAGE FAULT" : "PT HIT"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-mono text-foreground-muted flex-wrap">
                    <span className="rounded bg-surface px-1.5 py-0.5">VA {cur.virtualAddress}</span>
                    <ChevronRight className="h-3 w-3 text-foreground-subtle" />
                    <span className="rounded bg-surface px-1.5 py-0.5">Page {cur.virtualPage}</span>
                    <span className="text-foreground-subtle">+</span>
                    <span className="rounded bg-surface px-1.5 py-0.5">Offset {cur.offset}</span>
                    <ChevronRight className="h-3 w-3 text-foreground-subtle" />
                    {cur.physicalFrame !== null ? (
                      <>
                        <span className="rounded bg-surface px-1.5 py-0.5">Frame {cur.physicalFrame}</span>
                        <ChevronRight className="h-3 w-3 text-foreground-subtle" />
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 text-primary">PA {cur.physicalAddress}</span>
                      </>
                    ) : (
                      <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-red-400">Not in memory</span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Address timeline */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Address Sequence
              </h3>
              <div className="flex flex-wrap gap-1">
                {memResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setMemStep(i)}
                    className={cn(
                      "rounded px-2 py-1 text-[10px] font-mono transition-colors border",
                      i === memStep
                        ? "border-primary bg-primary/15 text-primary"
                        : i <= memStep
                          ? r.tlbHit
                            ? "border-green-500/30 bg-green-500/10 text-green-400"
                            : r.pageFault
                              ? "border-red-500/30 bg-red-500/10 text-red-400"
                              : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                          : "border-border bg-surface text-foreground-subtle",
                    )}
                  >
                    {r.virtualAddress}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Table snapshot */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Translation Log
              </h3>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-border bg-elevated text-foreground-muted">
                      <th className="px-2 py-1 text-left">#</th>
                      <th className="px-2 py-1 text-right">VA</th>
                      <th className="px-2 py-1 text-right">Page</th>
                      <th className="px-2 py-1 text-right">Offset</th>
                      <th className="px-2 py-1 text-right">Frame</th>
                      <th className="px-2 py-1 text-right">PA</th>
                      <th className="px-2 py-1 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memResults.slice(0, memStep + 1).map((r, i) => (
                      <tr
                        key={i}
                        className={cn(
                          "border-b border-border/50",
                          i === memStep ? "bg-primary/5" : "",
                        )}
                      >
                        <td className="px-2 py-1 font-mono text-foreground-subtle">{i + 1}</td>
                        <td className="px-2 py-1 text-right font-mono text-foreground">{r.virtualAddress}</td>
                        <td className="px-2 py-1 text-right font-mono text-foreground">{r.virtualPage}</td>
                        <td className="px-2 py-1 text-right font-mono text-foreground">{r.offset}</td>
                        <td className="px-2 py-1 text-right font-mono text-foreground">
                          {r.physicalFrame !== null ? r.physicalFrame : "-"}
                        </td>
                        <td className="px-2 py-1 text-right font-mono text-foreground">
                          {r.physicalAddress !== null ? r.physicalAddress : "-"}
                        </td>
                        <td className="px-2 py-1 text-center">
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[9px] font-medium",
                              r.tlbHit ? "bg-green-500/20 text-green-400" :
                              r.pageFault ? "bg-red-500/20 text-red-400" :
                              "bg-blue-500/20 text-blue-400",
                            )}
                          >
                            {r.tlbHit ? "TLB HIT" : r.pageFault ? "FAULT" : "PT HIT"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <Cpu className="h-10 w-10 text-foreground-subtle opacity-20" />
            <p className="text-sm text-foreground-muted">Every program thinks it owns all of memory. How?</p>
            <button onClick={runMemorySimulation} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              <Play className="h-3.5 w-3.5" /> Run Translation
            </button>
          </div>
        )}
      </div>
    );
  } else if (active === "mem-alloc") {
    canvas = (
      <div className="flex h-full w-full flex-col bg-background p-6 overflow-auto">
        {error && (
          <div className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="alloc-algo" className="mb-1 block text-xs font-medium text-foreground-muted">
              Algorithm
            </label>
            <select
              id="alloc-algo"
              value={allocAlgo}
              onChange={(e) => setAllocAlgo(e.target.value as AllocAlgo)}
              className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              {ALLOC_ALGOS.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="alloc-totalmem" className="mb-1 block text-xs font-medium text-foreground-muted">
              Total Memory
            </label>
            <input
              id="alloc-totalmem"
              type="number"
              min={64}
              max={1024}
              step={16}
              value={allocTotalMem}
              onChange={(e) => setAllocTotalMem(+e.target.value)}
              className="h-8 w-20 rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <button
            onClick={runAllocSimulation}
            className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Play className="h-3.5 w-3.5" /> Run
          </button>
          <button
            onClick={runAllocComparison}
            className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-elevated"
          >
            <BarChart3 className="h-3.5 w-3.5" /> Compare All
          </button>
        </div>

        {/* Request list */}
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Requests
            </h3>
            <button
              onClick={() => addAllocRequest('alloc')}
              className="flex h-6 items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] text-foreground hover:bg-elevated"
            >
              <Plus className="h-3 w-3" /> Alloc
            </button>
            <button
              onClick={() => addAllocRequest('dealloc')}
              className="flex h-6 items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] text-foreground hover:bg-elevated"
            >
              <Plus className="h-3 w-3" /> Dealloc
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allocRequests.map((req, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-mono",
                  req.type === 'alloc'
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-red-500/30 bg-red-500/5",
                )}
              >
                <select
                  value={req.type}
                  onChange={(e) => updateAllocRequest(i, 'type', e.target.value)}
                  className="bg-transparent text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="alloc">alloc</option>
                  <option value="dealloc">dealloc</option>
                </select>
                <input
                  value={req.processId}
                  onChange={(e) => updateAllocRequest(i, 'processId', e.target.value)}
                  className="w-10 bg-transparent text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                />
                {req.type === 'alloc' && (
                  <input
                    type="number"
                    min={1}
                    value={req.size ?? 0}
                    onChange={(e) => updateAllocRequest(i, 'size', +e.target.value)}
                    className="w-12 bg-transparent text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                  />
                )}
                <button
                  onClick={() => removeAllocRequest(i)}
                  className="ml-1 text-foreground-subtle hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Step controls */}
        {allocSteps && allocSteps.length > 0 && (
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => setAllocStep(0)}
              className="flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
            <button
              onClick={() => setAllocStep((s) => Math.min(s + 1, allocSteps!.length - 1))}
              disabled={allocStep >= allocSteps.length - 1}
              className="flex h-7 items-center gap-1 rounded bg-primary px-2 text-xs text-white hover:bg-primary/90 disabled:opacity-40"
            >
              <ChevronRight className="h-3 w-3" /> Step
            </button>
            <button
              onClick={() => setAllocStep(allocSteps!.length - 1)}
              className="flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated"
            >
              Show All
            </button>
            <span className="ml-2 font-mono text-[10px] text-foreground-subtle">
              {allocStep + 1}/{allocSteps.length}
            </span>
          </div>
        )}

        {/* Single algorithm view */}
        {allocSteps && allocSteps.length > 0 && (() => {
          const cur = allocSteps[allocStep];
          return (
            <div className="flex-1 space-y-4 overflow-auto" aria-live="polite">
              {/* Description */}
              <div className={cn(
                "rounded-md border p-3",
                cur.action === 'allocate' ? "border-green-500/40 bg-green-500/5" :
                cur.action === 'deallocate' ? "border-red-500/40 bg-red-500/5" :
                "border-blue-500/40 bg-blue-500/5",
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-foreground">Step {cur.tick}</span>
                  <span className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-medium",
                    cur.action === 'allocate' ? "bg-green-500/20 text-green-400" :
                    cur.action === 'deallocate' ? "bg-red-500/20 text-red-400" :
                    "bg-blue-500/20 text-blue-400",
                  )}>
                    {cur.action.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-foreground-muted font-mono">{cur.description}</p>
              </div>

              {/* Memory bar */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Memory Layout
                  </h3>
                  <span className="font-mono text-[10px] text-foreground-subtle">
                    {allocTotalMem} bytes total
                  </span>
                </div>
                <div className="flex h-12 w-full overflow-hidden rounded-md border border-border">
                  {cur.blocks.map((block) => {
                    const widthPct = (block.size / allocTotalMem) * 100;
                    return (
                      <div
                        key={block.id}
                        className="relative flex h-full items-center justify-center text-[9px] font-mono font-medium text-white transition-all duration-300"
                        style={{
                          width: `${widthPct}%`,
                          minWidth: widthPct > 0.5 ? 2 : 0,
                          backgroundColor: block.isFree ? "#1f2937" : getAllocColor(block.processId ?? ""),
                          borderRight: '1px solid rgba(0,0,0,0.3)',
                        }}
                        title={block.isFree ? `Free: ${block.size}B at ${block.start}` : `${block.processId}: ${block.size}B at ${block.start}`}
                      >
                        {widthPct > 6 && (
                          <span className="truncate px-1">
                            {block.isFree ? `Free ${block.size}` : `${block.processId} ${block.size}`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Address markers */}
                <div className="mt-0.5 flex justify-between text-[8px] font-mono text-foreground-subtle">
                  <span>0</span>
                  <span>{allocTotalMem}</span>
                </div>
              </div>

              {/* Fragmentation indicator */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-foreground-muted">External Fragmentation</span>
                <div className="flex-1 h-3 rounded-full bg-elevated border border-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${cur.fragmentation}%`,
                      backgroundColor: cur.fragmentation > 50 ? '#ef4444' : cur.fragmentation > 25 ? '#f59e0b' : '#22c55e',
                    }}
                  />
                </div>
                <span className={cn(
                  "font-mono text-xs font-semibold",
                  cur.fragmentation > 50 ? "text-red-400" : cur.fragmentation > 25 ? "text-amber-400" : "text-green-400",
                )}>
                  {cur.fragmentation}%
                </span>
              </div>

              {/* Block table */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Block Table
                </h3>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-border bg-elevated text-foreground-muted">
                        <th className="px-2 py-1 text-left">Start</th>
                        <th className="px-2 py-1 text-right">Size</th>
                        <th className="px-2 py-1 text-center">Status</th>
                        <th className="px-2 py-1 text-left">Process</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cur.blocks.map((block) => (
                        <tr key={block.id} className="border-b border-border/50">
                          <td className="px-2 py-1 font-mono text-foreground">{block.start}</td>
                          <td className="px-2 py-1 text-right font-mono text-foreground">{block.size}B</td>
                          <td className="px-2 py-1 text-center">
                            <span className={cn(
                              "rounded px-1.5 py-0.5 text-[9px] font-medium",
                              block.isFree ? "bg-gray-500/20 text-gray-400" : "bg-green-500/20 text-green-400",
                            )}>
                              {block.isFree ? "FREE" : "USED"}
                            </span>
                          </td>
                          <td className="px-2 py-1 font-mono text-foreground">
                            {block.processId ?? "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step timeline */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Timeline
                </h3>
                <div className="flex flex-wrap gap-1">
                  {allocSteps.map((step, i) => (
                    <button
                      key={i}
                      onClick={() => setAllocStep(i)}
                      className={cn(
                        "rounded px-2 py-1 text-[10px] font-mono transition-colors border",
                        i === allocStep
                          ? "border-primary bg-primary/15 text-primary"
                          : i <= allocStep
                            ? step.action === 'allocate'
                              ? "border-green-500/30 bg-green-500/10 text-green-400"
                              : "border-red-500/30 bg-red-500/10 text-red-400"
                            : "border-border bg-surface text-foreground-subtle",
                      )}
                    >
                      {step.tick}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Comparison view */}
        {allocCompare && (() => {
          const entries = Object.entries(allocCompare);
          // Show final step for each algorithm
          return (
            <div className="flex-1 space-y-6 overflow-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Algorithm Comparison
                </h2>
                <button
                  onClick={() => setAllocCompare(null)}
                  className="flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated"
                >
                  <X className="h-3.5 w-3.5" /> Close
                </button>
              </div>

              {entries.map(([name, steps]) => {
                const final = steps[steps.length - 1];
                return (
                  <div key={name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{name}</span>
                      <span className={cn(
                        "font-mono text-[10px] font-semibold",
                        final.fragmentation > 50 ? "text-red-400" : final.fragmentation > 25 ? "text-amber-400" : "text-green-400",
                      )}>
                        Frag: {final.fragmentation}%
                      </span>
                    </div>
                    <div className="flex h-10 w-full overflow-hidden rounded-md border border-border">
                      {final.blocks.map((block) => {
                        const widthPct = (block.size / allocTotalMem) * 100;
                        return (
                          <div
                            key={block.id}
                            className="relative flex h-full items-center justify-center text-[8px] font-mono font-medium text-white"
                            style={{
                              width: `${widthPct}%`,
                              minWidth: widthPct > 0.5 ? 2 : 0,
                              backgroundColor: block.isFree ? "#1f2937" : getAllocColor(block.processId ?? ""),
                              borderRight: '1px solid rgba(0,0,0,0.3)',
                            }}
                            title={block.isFree ? `Free: ${block.size}B` : `${block.processId}: ${block.size}B`}
                          >
                            {widthPct > 5 && (
                              <span className="truncate px-0.5">
                                {block.isFree ? `Free` : block.processId}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Fragmentation comparison bar chart */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Final Fragmentation
                </h3>
                <div className="space-y-2">
                  {entries.map(([name, steps]) => {
                    const frag = steps[steps.length - 1].fragmentation;
                    return (
                      <div key={name} className="flex items-center gap-2">
                        <span className="w-20 text-[10px] font-medium text-foreground truncate">{name}</span>
                        <div className="flex-1 h-5 rounded bg-elevated border border-border overflow-hidden">
                          <div
                            className="h-full rounded transition-all"
                            style={{
                              width: `${frag}%`,
                              backgroundColor: frag > 50 ? '#ef4444' : frag > 25 ? '#f59e0b' : '#22c55e',
                            }}
                          />
                        </div>
                        <span className="w-10 text-right font-mono text-[10px] text-foreground">{frag}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {!allocSteps && !allocCompare && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <Cpu className="h-10 w-10 text-foreground-subtle opacity-20" />
            <p className="text-sm text-foreground-muted">How does the OS fit processes into memory gaps?</p>
            <button onClick={runAllocSimulation} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              <Play className="h-3.5 w-3.5" /> Run First Fit
            </button>
          </div>
        )}
      </div>
    );
  } else if (active === "thread-sync") {
    canvas = (
      <div className="flex h-full w-full flex-col bg-background p-6 overflow-auto">
        {error && (
          <div className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="sync-primitive" className="mb-1 block text-xs font-medium text-foreground-muted">
              Primitive
            </label>
            <select
              id="sync-primitive"
              value={syncPrimitive}
              onChange={(e) => setSyncPrimitive(e.target.value as SyncPrimitive)}
              className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              {SYNC_PRIMITIVES.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>
          {syncPrimitive === "mutex" && (
            <div>
              <label htmlFor="sync-threads-mutex" className="mb-1 block text-xs font-medium text-foreground-muted">
                Threads
              </label>
              <input
                id="sync-threads-mutex"
                type="number"
                min={2}
                max={8}
                value={syncThreadCount}
                onChange={(e) => setSyncThreadCount(+e.target.value)}
                className="h-8 w-16 rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          )}
          {syncPrimitive === "semaphore" && (
            <>
              <div>
                <label htmlFor="sync-threads-sem" className="mb-1 block text-xs font-medium text-foreground-muted">
                  Threads
                </label>
                <input
                  id="sync-threads-sem"
                  type="number"
                  min={2}
                  max={8}
                  value={syncThreadCount}
                  onChange={(e) => setSyncThreadCount(+e.target.value)}
                  className="h-8 w-16 rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="sync-permits" className="mb-1 block text-xs font-medium text-foreground-muted">
                  Permits
                </label>
                <input
                  id="sync-permits"
                  type="number"
                  min={1}
                  max={7}
                  value={syncPermits}
                  onChange={(e) => setSyncPermits(+e.target.value)}
                  className="h-8 w-16 rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </>
          )}
          {syncPrimitive === "rw-lock" && (
            <>
              <div>
                <label htmlFor="sync-readers" className="mb-1 block text-xs font-medium text-foreground-muted">
                  Readers
                </label>
                <input
                  id="sync-readers"
                  type="number"
                  min={1}
                  max={6}
                  value={syncReaders}
                  onChange={(e) => setSyncReaders(+e.target.value)}
                  className="h-8 w-16 rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="sync-writers" className="mb-1 block text-xs font-medium text-foreground-muted">
                  Writers
                </label>
                <input
                  id="sync-writers"
                  type="number"
                  min={1}
                  max={4}
                  value={syncWriters}
                  onChange={(e) => setSyncWriters(+e.target.value)}
                  className="h-8 w-16 rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </>
          )}
          <button
            onClick={runThreadSync}
            className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Play className="h-3.5 w-3.5" /> Run
          </button>
        </div>

        {/* Step controls */}
        {syncEvents && syncEvents.length > 0 && (
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => { setSyncStep(0); setSyncPlaying(false); }}
              className="flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
            <button
              onClick={() => setSyncPlaying((p) => !p)}
              className={cn(
                "flex h-7 items-center gap-1 rounded px-2 text-xs text-white",
                syncPlaying
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-primary hover:bg-primary/90",
              )}
            >
              <Play className="h-3 w-3" />
              {syncPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={() =>
                setSyncStep((s) =>
                  syncEvents ? Math.min(s + 1, syncEvents.length - 1) : s,
                )
              }
              disabled={!syncEvents || syncStep >= syncEvents.length - 1}
              className="flex h-7 items-center gap-1 rounded bg-primary px-2 text-xs text-white hover:bg-primary/90 disabled:opacity-40"
            >
              Step
            </button>
            <button
              onClick={() => {
                if (syncEvents) setSyncStep(syncEvents.length - 1);
                setSyncPlaying(false);
              }}
              className="flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated"
            >
              Show All
            </button>
            <span className="ml-2 font-mono text-[10px] text-foreground-subtle">
              {syncStep + 1}/{syncEvents.length}
            </span>
          </div>
        )}

        {/* Canvas visualization */}
        {syncEvents && syncEvents.length > 0 ? (
          <div className="flex-1 overflow-auto" aria-live="polite">
            <div className="rounded-md border border-border bg-elevated p-4 overflow-auto">
              <ThreadSyncCanvas
                events={syncEvents}
                currentStep={syncStep}
                primitive={syncPrimitive}
              />
            </div>

            {/* Event timeline */}
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Event Timeline
              </h3>
              <div className="space-y-0.5 max-h-48 overflow-auto rounded-md border border-border bg-surface p-2">
                {syncEvents.slice(0, syncStep + 1).map((e, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-2 py-0.5 text-[10px] font-mono",
                      i === syncStep ? "bg-primary/5" : "",
                      e.action === 'acquire' ? "text-green-400" :
                      e.action === 'release' || e.action === 'signal' ? "text-blue-400" :
                      e.action === 'blocked' || e.action === 'wait' ? "text-amber-400" :
                      "text-foreground-muted",
                    )}
                  >
                    <span className="w-8 shrink-0 text-foreground-subtle">
                      t={e.tick}
                    </span>
                    <span className="w-8 shrink-0">
                      {e.threadId}
                    </span>
                    <span className="w-14 shrink-0 uppercase">
                      {e.action}
                    </span>
                    <span className="text-foreground-muted">{e.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <Cpu className="h-10 w-10 text-foreground-subtle opacity-20" />
            <p className="text-sm text-foreground-muted">What happens when two threads access the same data?</p>
            <button onClick={runThreadSync} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              <Play className="h-3.5 w-3.5" /> Run Mutex
            </button>
          </div>
        )}
      </div>
    );
  }

  return {
    sidebar: <OSSidebar active={active} onSelect={setActive} />,
    canvas,
    properties: (
      <OSProperties
        active={active}
        schedResult={schedResult}
        comparisonResults={comparisonResults}
        pageResult={pageResult}
        pageComparisonResults={pageComparisonResults}
        beladyResult={beladyResult}
        deadlockResult={deadlockResult}
        memoryResults={memResults}
        memoryStep={memStep}
        allocSteps={allocSteps}
        allocStep={allocStep}
        allocCompare={allocCompare}
        syncEvents={syncEvents}
        syncStep={syncStep}
        syncPrimitive={syncPrimitive}
      />
    ),
    bottomPanel: (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <button
            onClick={() => setOsBottomTab("log")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors",
              osBottomTab === "log"
                ? "bg-primary/15 text-primary"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            Event Log
          </button>
          <button
            onClick={() => setOsBottomTab("learn")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors",
              osBottomTab === "learn"
                ? "bg-primary/15 text-primary"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            <BookOpen className="h-3 w-3" />
            Learn
          </button>
        </div>

        {osBottomTab === "learn" ? (
          <div className="flex-1 overflow-auto px-4 py-3">
            <Suspense fallback={<div className="py-4 text-center text-xs text-foreground-subtle">Loading...</div>}>
              <GCPauseLatencyVisualizer />
            </Suspense>
          </div>
        ) : (
          <div className="flex-1 overflow-auto px-4 py-1 font-mono text-xs">
            {active === "cpu-scheduling" && schedResult ? (
              schedResult.events.map((e, i) => (
                <div
                  key={i}
                  className="flex gap-2 border-b border-border/30 py-1 text-foreground-muted"
                >
                  <span className="w-8 shrink-0 text-foreground-subtle">
                    t={e.tick}
                  </span>
                  <span
                    className={cn(
                      "w-16 shrink-0",
                      e.type === "complete"
                        ? "text-green-400"
                        : e.type === "preempt" || e.type === "demote"
                          ? "text-amber-400"
                          : e.type === "boost"
                            ? "text-cyan-400"
                            : e.type === "io-return"
                              ? "text-blue-400"
                              : "text-foreground-muted",
                    )}
                  >
                    {e.type}
                  </span>
                  <span>{e.description}</span>
                </div>
              ))
            ) : active === "page-replacement" && pageResult ? (
              pageResult.events.slice(0, pageStep + 1).map((e, i) => (
                <div
                  key={i}
                  className="flex gap-2 border-b border-border/30 py-1 text-foreground-muted"
                >
                  <span className="w-8 shrink-0 text-foreground-subtle">
                    t={e.tick}
                  </span>
                  <span
                    className={cn(
                      "w-12 shrink-0",
                      e.hit ? "text-green-400" : "text-red-400",
                    )}
                  >
                    {e.hit ? "HIT" : "FAULT"}
                  </span>
                  <span>{e.description}</span>
                </div>
              ))
            ) : active === "deadlock" && deadlockResult ? (
              deadlockResult.events.map((e, i) => (
                <div
                  key={i}
                  className="flex gap-2 border-b border-border/30 py-1 text-foreground-muted"
                >
                  <span className="w-8 shrink-0 text-foreground-subtle">
                    t={e.tick}
                  </span>
                  <span
                    className={cn(
                      "w-20 shrink-0",
                      e.type === "safe"
                        ? "text-green-400"
                        : e.type === "deadlock-detected"
                          ? "text-red-400"
                          : e.type === "release"
                            ? "text-blue-400"
                            : "text-foreground-muted",
                    )}
                  >
                    {e.type}
                  </span>
                  <span>{e.description}</span>
                </div>
              ))
            ) : active === "memory" && memResults ? (
              memResults.slice(0, memStep + 1).map((e, i) => (
                <div
                  key={i}
                  className="flex gap-2 border-b border-border/30 py-1 text-foreground-muted"
                >
                  <span className="w-8 shrink-0 text-foreground-subtle">
                    {i + 1}
                  </span>
                  <span
                    className={cn(
                      "w-16 shrink-0",
                      e.tlbHit ? "text-green-400" :
                      e.pageFault ? "text-red-400" :
                      "text-blue-400",
                    )}
                  >
                    {e.tlbHit ? "TLB HIT" : e.pageFault ? "FAULT" : "PT HIT"}
                  </span>
                  <span>{e.description}</span>
                </div>
              ))
            ) : active === "mem-alloc" && allocSteps ? (
              allocSteps.slice(0, allocStep + 1).map((e, i) => (
                <div
                  key={i}
                  className="flex gap-2 border-b border-border/30 py-1 text-foreground-muted"
                >
                  <span className="w-8 shrink-0 text-foreground-subtle">
                    {e.tick}
                  </span>
                  <span
                    className={cn(
                      "w-16 shrink-0",
                      e.action === 'allocate' ? "text-green-400" :
                      e.action === 'deallocate' ? "text-red-400" :
                      "text-blue-400",
                    )}
                  >
                    {e.action.toUpperCase()}
                  </span>
                  <span>Frag: {e.fragmentation}% | {e.description}</span>
                </div>
              ))
            ) : active === "thread-sync" && syncEvents ? (
              syncEvents.slice(0, syncStep + 1).map((e, i) => (
                <div
                  key={i}
                  className="flex gap-2 border-b border-border/30 py-1 text-foreground-muted"
                >
                  <span className="w-8 shrink-0 text-foreground-subtle">
                    t={e.tick}
                  </span>
                  <span
                    className={cn(
                      "w-16 shrink-0",
                      e.action === 'acquire' ? "text-green-400" :
                      e.action === 'release' || e.action === 'signal' ? "text-blue-400" :
                      e.action === 'blocked' || e.action === 'wait' ? "text-amber-400" :
                      "text-foreground-muted",
                    )}
                  >
                    {e.action.toUpperCase()}
                  </span>
                  <span className="w-8 shrink-0">{e.threadId}</span>
                  <span>{e.description}</span>
                </div>
              ))
            ) : (
              <p className="py-2 text-foreground-subtle">
                Run a simulation to see events here.
              </p>
            )}
          </div>
        )}
      </div>
    ),
  };
}

export const OSModule = memo(function OSModule() {
  return null;
});
