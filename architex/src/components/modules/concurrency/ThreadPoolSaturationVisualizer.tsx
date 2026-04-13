"use client";

import React, { memo, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Play, RotateCcw, AlertTriangle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────

interface ThreadSlot {
  id: number;
  status: "idle" | "busy" | "saturated";
  taskId: string | null;
  elapsed: number;
}

interface QueuedTask {
  id: string;
  arrivalTick: number;
  duration: number;
}

interface PoolSnapshot {
  tick: number;
  threads: ThreadSlot[];
  queue: QueuedTask[];
  rejected: number;
  description: string;
}

// ── Simulation ─────────────────────────────────────────────

function simulateThreadPool(
  poolSize: number,
  maxQueue: number,
  taskBurst: Array<{ tick: number; duration: number }>,
): PoolSnapshot[] {
  const snapshots: PoolSnapshot[] = [];
  const threads: ThreadSlot[] = Array.from({ length: poolSize }, (_, i) => ({
    id: i,
    status: "idle" as const,
    taskId: null,
    elapsed: 0,
  }));
  let queue: QueuedTask[] = [];
  let rejected = 0;

  // Build a map from task id to duration for O(1) lookup
  const taskDurations = new Map<string, number>();
  for (let idx = 0; idx < taskBurst.length; idx++) {
    taskDurations.set(`task-${idx}`, taskBurst[idx].duration);
  }

  const maxTick = Math.max(...taskBurst.map((t) => t.tick + t.duration)) + 5;

  for (let tick = 0; tick <= maxTick; tick++) {
    // Complete finished tasks
    for (const t of threads) {
      if (t.status === "busy" || t.status === "saturated") {
        t.elapsed++;
        const dur = t.taskId ? taskDurations.get(t.taskId) : undefined;
        if (dur !== undefined && t.elapsed >= dur) {
          t.status = "idle";
          t.taskId = null;
          t.elapsed = 0;
        }
      }
    }

    // Enqueue new arrivals
    for (let idx = 0; idx < taskBurst.length; idx++) {
      if (taskBurst[idx].tick !== tick) continue;
      const id = `task-${idx}`;
      const idle = threads.find((t) => t.status === "idle");
      if (idle) {
        idle.status = "busy";
        idle.taskId = id;
        idle.elapsed = 0;
      } else if (queue.length < maxQueue) {
        queue.push({ id, arrivalTick: tick, duration: taskBurst[idx].duration });
      } else {
        rejected++;
      }
    }

    // Drain queue into free threads
    while (queue.length > 0) {
      const idle = threads.find((t) => t.status === "idle");
      if (!idle) break;
      const next = queue.shift()!;
      idle.status = "busy";
      idle.taskId = next.id;
      idle.elapsed = 0;
    }

    // Mark saturated when queue is full and all threads busy
    const busyCount = threads.filter((t) => t.status !== "idle").length;
    if (busyCount === poolSize && queue.length >= maxQueue) {
      for (const t of threads) {
        if (t.status === "busy") t.status = "saturated";
      }
    }

    const desc =
      busyCount === 0
        ? `Tick ${tick}: Pool idle`
        : busyCount < poolSize
          ? `Tick ${tick}: ${busyCount}/${poolSize} threads busy, queue: ${queue.length}`
          : queue.length >= maxQueue
            ? `Tick ${tick}: SATURATED -- all threads busy, queue full (${rejected} rejected)`
            : `Tick ${tick}: All threads busy, queue: ${queue.length}/${maxQueue}`;

    snapshots.push({
      tick,
      threads: threads.map((t) => ({ ...t })),
      queue: [...queue],
      rejected,
      description: desc,
    });
  }

  return snapshots;
}

// ── Default scenario ───────────────────────────────────────

const DEFAULT_TASKS: Array<{ tick: number; duration: number }> = [
  { tick: 0, duration: 4 },
  { tick: 0, duration: 3 },
  { tick: 1, duration: 5 },
  { tick: 1, duration: 3 },
  { tick: 2, duration: 4 },
  { tick: 2, duration: 4 },
  { tick: 3, duration: 3 },
  { tick: 3, duration: 5 },
  { tick: 4, duration: 3 },
  { tick: 4, duration: 4 },
  { tick: 5, duration: 2 },
  { tick: 5, duration: 3 },
];

const STATUS_COLORS: Record<ThreadSlot["status"], string> = {
  idle: "bg-zinc-700",
  busy: "bg-blue-500",
  saturated: "bg-red-500",
};

const STATUS_LABELS: Record<ThreadSlot["status"], string> = {
  idle: "Idle",
  busy: "Busy",
  saturated: "Saturated",
};

// ── Component ──────────────────────────────────────────────

function ThreadPoolSaturationVisualizerInner() {
  const poolSize = 4;
  const maxQueue = 3;
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const snapshots = useMemo(
    () => simulateThreadPool(poolSize, maxQueue, DEFAULT_TASKS),
    [],
  );
  const maxSteps = snapshots.length - 1;
  const current = snapshots[stepIndex];

  useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= maxSteps) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 400);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, maxSteps]);

  const handlePlay = useCallback(() => {
    if (stepIndex >= maxSteps) setStepIndex(0);
    setPlaying((p) => !p);
  }, [stepIndex, maxSteps]);

  const handleReset = useCallback(() => {
    setPlaying(false);
    setStepIndex(0);
  }, []);

  if (!current) return null;

  const isSaturated = current.threads.some((t) => t.status === "saturated");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-2">
        <Activity className="h-3.5 w-3.5 text-foreground-muted" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Thread Pool Saturation
        </h3>
        {isSaturated && (
          <span className="ml-auto flex items-center gap-1 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
            <AlertTriangle className="h-3 w-3" /> SATURATED
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {/* Thread pool grid */}
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Pool ({poolSize} threads)
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {current.threads.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "flex flex-col items-center justify-center rounded-md px-2 py-2 text-[10px] font-medium transition-colors",
                  STATUS_COLORS[t.status],
                  t.status === "idle" ? "text-zinc-400" : "text-white",
                )}
              >
                <span>T{t.id}</span>
                <span className="text-[9px] opacity-80">
                  {STATUS_LABELS[t.status]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Queue */}
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Queue ({current.queue.length}/{maxQueue})
          </p>
          <div className="flex gap-1">
            {Array.from({ length: maxQueue }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "flex h-6 w-10 items-center justify-center rounded text-[9px] font-mono",
                  i < current.queue.length
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-zinc-800 text-zinc-600",
                )}
              >
                {i < current.queue.length ? current.queue[i].id.slice(-1) : "--"}
              </div>
            ))}
          </div>
        </div>

        {/* Rejected counter */}
        {current.rejected > 0 && (
          <div className="mb-3 rounded-md bg-red-500/10 px-2.5 py-1.5 text-xs text-red-400">
            {current.rejected} task(s) rejected (queue full)
          </div>
        )}

        {/* Step description */}
        <p className="text-xs text-foreground-muted">{current.description}</p>

        {/* Legend */}
        <div className="mt-3 space-y-1">
          {(Object.keys(STATUS_COLORS) as Array<ThreadSlot["status"]>).map((status) => (
            <div key={status} className="flex items-center gap-2">
              <div className={cn("h-2.5 w-2.5 rounded-sm", STATUS_COLORS[status])} />
              <span className="text-[10px] text-foreground-muted">
                {STATUS_LABELS[status]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 border-t border-sidebar-border px-3 py-2">
        <button
          onClick={handlePlay}
          className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-medium text-white transition-colors hover:bg-primary/90"
        >
          <Play className="h-3 w-3" /> {playing ? "Pause" : "Play"}
        </button>
        <button
          onClick={handleReset}
          className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
        <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
          {stepIndex}/{maxSteps}
        </span>
      </div>
    </div>
  );
}

const ThreadPoolSaturationVisualizer = memo(ThreadPoolSaturationVisualizerInner);
export default ThreadPoolSaturationVisualizer;
