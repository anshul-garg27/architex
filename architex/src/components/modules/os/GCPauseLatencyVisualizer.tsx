"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Cpu,
  Play,
  Pause,
  RotateCcw,
  BarChart3,
  AlertTriangle,
  Clock,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

type GCAlgorithm = "g1" | "zgc" | "shenandoah";

interface GCConfig {
  name: string;
  description: string;
  minorPauseMs: number;
  majorPauseMs: number;
  minorFrequency: number; // per 100 ticks
  majorFrequency: number;
  concurrentPhase: boolean;
}

interface TimelineEvent {
  tick: number;
  latencyMs: number;
  isGCPause: boolean;
  gcType: "none" | "minor" | "major";
  algorithm: GCAlgorithm;
}

interface HeapState {
  usedMB: number;
  totalMB: number;
  edenMB: number;
  survivorMB: number;
  oldGenMB: number;
}

// ── Constants ──────────────────────────────────────────────────

const GC_ALGORITHMS: Record<GCAlgorithm, GCConfig> = {
  g1: {
    name: "G1 (Garbage First)",
    description: "Region-based collector. Targets pause time goals. Young GC pauses 5-20ms, mixed GC pauses 20-100ms.",
    minorPauseMs: 12,
    majorPauseMs: 80,
    minorFrequency: 15,
    majorFrequency: 3,
    concurrentPhase: false,
  },
  zgc: {
    name: "ZGC",
    description: "Sub-millisecond pauses regardless of heap size. Concurrent marking and relocation. Designed for low-latency.",
    minorPauseMs: 0.5,
    majorPauseMs: 2,
    minorFrequency: 20,
    majorFrequency: 5,
    concurrentPhase: true,
  },
  shenandoah: {
    name: "Shenandoah",
    description: "Concurrent compacting collector. Pauses are O(1), not proportional to heap size. Good for large heaps.",
    minorPauseMs: 1,
    majorPauseMs: 5,
    minorFrequency: 18,
    majorFrequency: 4,
    concurrentPhase: true,
  },
};

const TIMELINE_LENGTH = 80;
const BASE_LATENCY_MS = 2;
const MAX_LATENCY_DISPLAY = 120;

// ── Component ──────────────────────────────────────────────────

export default function GCPauseLatencyVisualizer() {
  const [algorithm, setAlgorithm] = useState<GCAlgorithm>("g1");
  const [heapSizeMB, setHeapSizeMB] = useState(512);
  const [allocationRate, setAllocationRate] = useState(50); // MB/s
  const [isRunning, setIsRunning] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [heap, setHeap] = useState<HeapState>({ usedMB: 0, totalMB: 512, edenMB: 0, survivorMB: 0, oldGenMB: 0 });
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const config = GC_ALGORITHMS[algorithm];

  const p99 = useMemo(() => {
    if (timeline.length < 10) return 0;
    const sorted = [...timeline].map((e) => e.latencyMs).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.99)] ?? 0;
  }, [timeline]);

  const p50 = useMemo(() => {
    if (timeline.length < 5) return 0;
    const sorted = [...timeline].map((e) => e.latencyMs).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.5)] ?? 0;
  }, [timeline]);

  const gcPausePercent = useMemo(() => {
    if (timeline.length === 0) return 0;
    const gcTicks = timeline.filter((e) => e.isGCPause).length;
    return Math.round((gcTicks / timeline.length) * 100);
  }, [timeline]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeline([]);
    setTick(0);
    setHeap({ usedMB: 0, totalMB: heapSizeMB, edenMB: 0, survivorMB: 0, oldGenMB: 0 });
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [heapSizeMB]);

  useEffect(() => {
    handleReset();
  }, [algorithm, heapSizeMB, handleReset]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTick((t) => {
        const newTick = t + 1;

        setHeap((prev) => {
          const alloc = allocationRate / 10; // per tick
          let eden = prev.edenMB + alloc;
          let survivor = prev.survivorMB;
          let oldGen = prev.oldGenMB;
          const isMinorGC = Math.random() * 100 < config.minorFrequency;
          const isMajorGC = Math.random() * 100 < config.majorFrequency;

          if (isMinorGC) {
            survivor += eden * 0.1;
            oldGen += eden * 0.05;
            eden = 0;
          }
          if (isMajorGC) {
            oldGen = oldGen * 0.4;
            survivor = survivor * 0.2;
          }

          return {
            usedMB: Math.min(eden + survivor + oldGen, heapSizeMB * 0.95),
            totalMB: heapSizeMB,
            edenMB: Math.min(eden, heapSizeMB * 0.3),
            survivorMB: Math.min(survivor, heapSizeMB * 0.1),
            oldGenMB: Math.min(oldGen, heapSizeMB * 0.6),
          };
        });

        // Determine GC pause
        const heapPressure = allocationRate / 100;
        const isMinor = Math.random() * 100 < config.minorFrequency * heapPressure;
        const isMajor = Math.random() * 100 < config.majorFrequency * heapPressure;

        let latencyMs = BASE_LATENCY_MS + Math.random() * 2;
        let isGCPause = false;
        let gcType: TimelineEvent["gcType"] = "none";

        if (isMajor) {
          const heapFactor = heapSizeMB / 256;
          latencyMs += config.concurrentPhase
            ? config.majorPauseMs + Math.random() * 2
            : config.majorPauseMs * heapFactor + Math.random() * config.majorPauseMs * 0.5;
          isGCPause = true;
          gcType = "major";
        } else if (isMinor) {
          latencyMs += config.concurrentPhase
            ? config.minorPauseMs + Math.random() * 0.5
            : config.minorPauseMs + Math.random() * config.minorPauseMs * 0.3;
          isGCPause = true;
          gcType = "minor";
        }

        const event: TimelineEvent = {
          tick: newTick,
          latencyMs: Math.round(latencyMs * 100) / 100,
          isGCPause,
          gcType,
          algorithm,
        };

        setTimeline((prev) => [...prev.slice(-TIMELINE_LENGTH + 1), event]);

        return newTick;
      });
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, algorithm, heapSizeMB, allocationRate, config]);

  // Latency bar color
  const latencyColor = (event: TimelineEvent): string => {
    if (event.gcType === "major") return "var(--state-error)";
    if (event.gcType === "minor") return "var(--state-warning)";
    return "var(--state-success)";
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-5",
        "bg-[var(--surface)] border-[var(--border)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Trash2 className="h-5 w-5" style={{ color: "var(--primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          GC Pause Latency Visualizer
        </h3>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: "var(--gray-4)", color: "var(--foreground-muted)" }}>
          tick #{tick}
        </span>
      </div>

      {/* GC Algorithm Selector */}
      <div className="flex gap-2 mb-3">
        {(Object.keys(GC_ALGORITHMS) as GCAlgorithm[]).map((a) => (
          <motion.button
            key={a}
            whileTap={{ scale: 0.97 }}
            onClick={() => setAlgorithm(a)}
            className="flex-1 px-2 py-1.5 rounded-md text-xs font-medium border transition-colors"
            style={{
              background: a === algorithm ? "var(--violet-3)" : "var(--gray-3)",
              borderColor: a === algorithm ? "var(--primary)" : "var(--border)",
              color: a === algorithm ? "var(--primary)" : "var(--foreground-muted)",
            }}
          >
            {GC_ALGORITHMS[a].name}
          </motion.button>
        ))}
      </div>

      <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
        {config.description}
      </p>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--foreground-muted)" }}>
            Heap Size: <span style={{ color: "var(--foreground)" }}>{heapSizeMB}MB</span>
          </label>
          <input
            type="range"
            min={128}
            max={2048}
            step={128}
            value={heapSizeMB}
            onChange={(e) => setHeapSizeMB(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--foreground-muted)" }}>
            Alloc Rate: <span style={{ color: "var(--foreground)" }}>{allocationRate}MB/s</span>
          </label>
          <input
            type="range"
            min={10}
            max={200}
            step={10}
            value={allocationRate}
            onChange={(e) => setAllocationRate(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
        </div>
      </div>

      {/* Latency Timeline */}
      <div
        className="rounded-md border p-3 mb-4"
        style={{ background: "var(--gray-2)", borderColor: "var(--border)" }}
      >
        <p className="text-[10px] font-medium mb-2" style={{ color: "var(--foreground-muted)" }}>
          REQUEST LATENCY TIMELINE
        </p>
        <div className="flex items-end gap-px h-24">
          {timeline.map((event) => {
            const heightPct = Math.min((event.latencyMs / MAX_LATENCY_DISPLAY) * 100, 100);
            return (
              <motion.div
                key={event.tick}
                className="flex-1 min-w-[2px] rounded-t"
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                style={{ background: latencyColor(event) }}
                title={`${event.latencyMs}ms${event.gcType !== "none" ? ` (${event.gcType} GC)` : ""}`}
              />
            );
          })}
          {timeline.length === 0 && (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                Start simulation to see latency timeline
              </span>
            </div>
          )}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] font-mono" style={{ color: "var(--foreground-muted)" }}>0ms</span>
          <span className="text-[8px] font-mono" style={{ color: "var(--foreground-muted)" }}>{MAX_LATENCY_DISPLAY}ms</span>
        </div>
      </div>

      {/* Heap Visualization */}
      <div
        className="rounded-md border p-3 mb-4"
        style={{ background: "var(--gray-2)", borderColor: "var(--border)" }}
      >
        <p className="text-[10px] font-medium mb-2" style={{ color: "var(--foreground-muted)" }}>
          HEAP USAGE ({Math.round(heap.usedMB)}/{heap.totalMB}MB)
        </p>
        <div className="h-6 rounded overflow-hidden flex" style={{ background: "var(--gray-5)" }}>
          <motion.div
            className="h-full"
            animate={{ width: `${(heap.edenMB / heap.totalMB) * 100}%` }}
            style={{ background: "var(--state-success)" }}
          />
          <motion.div
            className="h-full"
            animate={{ width: `${(heap.survivorMB / heap.totalMB) * 100}%` }}
            style={{ background: "var(--state-warning)" }}
          />
          <motion.div
            className="h-full"
            animate={{ width: `${(heap.oldGenMB / heap.totalMB) * 100}%` }}
            style={{ background: "var(--state-error)" }}
          />
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: "var(--state-success)" }} />
            <span className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>Eden {Math.round(heap.edenMB)}MB</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: "var(--state-warning)" }} />
            <span className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>Survivor {Math.round(heap.survivorMB)}MB</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: "var(--state-error)" }} />
            <span className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>Old Gen {Math.round(heap.oldGenMB)}MB</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="rounded-md border p-2 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
          <p className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>P50</p>
          <p className="text-sm font-bold font-mono" style={{ color: "var(--state-success)" }}>
            {p50.toFixed(1)}ms
          </p>
        </div>
        <div className="rounded-md border p-2 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
          <p className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>P99</p>
          <p className="text-sm font-bold font-mono" style={{ color: p99 > 50 ? "var(--state-error)" : "var(--state-warning)" }}>
            {p99.toFixed(1)}ms
          </p>
        </div>
        <div className="rounded-md border p-2 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
          <p className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>GC Time</p>
          <p className="text-sm font-bold font-mono" style={{ color: gcPausePercent > 10 ? "var(--state-error)" : "var(--foreground)" }}>
            {gcPausePercent}%
          </p>
        </div>
        <div className="rounded-md border p-2 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
          <p className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>STW</p>
          <p className="text-sm font-bold font-mono" style={{ color: config.concurrentPhase ? "var(--state-success)" : "var(--state-error)" }}>
            {config.concurrentPhase ? "No" : "Yes"}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsRunning((r) => !r)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "rounded-md px-4 py-2 text-sm font-medium",
            "bg-[var(--primary)] text-[var(--primary-foreground)]",
            "hover:bg-[var(--primary-hover)] transition-colors",
          )}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isRunning ? "Pause" : "Start Service"}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          className={cn(
            "flex items-center justify-center gap-2",
            "rounded-md px-4 py-2 text-sm font-medium border",
          )}
          style={{ background: "var(--gray-3)", borderColor: "var(--border)", color: "var(--foreground-muted)" }}
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </motion.button>
      </div>
    </div>
  );
}
