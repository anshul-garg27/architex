"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { Timer, ArrowRight, ChevronRight, Zap, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

// ── Types ──────────────────────────────────────────────────────

type Operation = "insert" | "lookup" | "delete" | "range";

interface DSProfile {
  id: string;
  name: string;
  complexities: Record<Operation, string>;
  /** ops per complexity unit at base scale, in nanoseconds */
  baseNs: Record<Operation, (n: number) => number>;
  /** P95 multiplier over median */
  p95Multiplier: number;
}

// ── Sample Data ────────────────────────────────────────────────

const DS_PROFILES: DSProfile[] = [
  {
    id: "hash-map",
    name: "Hash Map",
    complexities: { insert: "O(1)*", lookup: "O(1)*", delete: "O(1)*", range: "O(n)" },
    baseNs: {
      insert: () => 80,
      lookup: () => 50,
      delete: () => 60,
      range: (n) => n * 50,
    },
    p95Multiplier: 3, // hash collisions, resizing
  },
  {
    id: "b-tree",
    name: "B-Tree",
    complexities: { insert: "O(log n)", lookup: "O(log n)", delete: "O(log n)", range: "O(log n + k)" },
    baseNs: {
      insert: (n) => Math.log2(n) * 4000, // disk-bound
      lookup: (n) => Math.log2(n) * 3000,
      delete: (n) => Math.log2(n) * 5000,
      range: (n) => Math.log2(n) * 3000 + 1000,
    },
    p95Multiplier: 2.5,
  },
  {
    id: "skip-list",
    name: "Skip List",
    complexities: { insert: "O(log n)", lookup: "O(log n)", delete: "O(log n)", range: "O(log n + k)" },
    baseNs: {
      insert: (n) => Math.log2(n) * 120,
      lookup: (n) => Math.log2(n) * 80,
      delete: (n) => Math.log2(n) * 100,
      range: (n) => Math.log2(n) * 80 + 500,
    },
    p95Multiplier: 2,
  },
  {
    id: "lsm-tree",
    name: "LSM-Tree",
    complexities: { insert: "O(1)*", lookup: "O(log n)", delete: "O(1)*", range: "O(n)" },
    baseNs: {
      insert: () => 200, // sequential write
      lookup: (n) => Math.log2(n) * 5000, // multiple levels
      delete: () => 200, // tombstone
      range: (n) => Math.log(n) * 8000,
    },
    p95Multiplier: 4, // compaction stalls
  },
  {
    id: "red-black-tree",
    name: "Red-Black Tree",
    complexities: { insert: "O(log n)", lookup: "O(log n)", delete: "O(log n)", range: "O(log n + k)" },
    baseNs: {
      insert: (n) => Math.log2(n) * 100,
      lookup: (n) => Math.log2(n) * 60,
      delete: (n) => Math.log2(n) * 110,
      range: (n) => Math.log2(n) * 60 + 400,
    },
    p95Multiplier: 1.5,
  },
];

const DATA_SIZES = [
  { value: 1_000, label: "1K" },
  { value: 10_000, label: "10K" },
  { value: 100_000, label: "100K" },
  { value: 1_000_000, label: "1M" },
  { value: 10_000_000, label: "10M" },
  { value: 100_000_000, label: "100M" },
];

const OPERATIONS: { id: Operation; label: string }[] = [
  { id: "insert", label: "Insert" },
  { id: "lookup", label: "Lookup" },
  { id: "delete", label: "Delete" },
  { id: "range", label: "Range Query" },
];

// ── Helpers ────────────────────────────────────────────────────

function formatLatency(ns: number): string {
  if (ns < 1_000) return `${ns.toFixed(0)}ns`;
  if (ns < 1_000_000) return `${(ns / 1_000).toFixed(1)}μs`;
  if (ns < 1_000_000_000) return `${(ns / 1_000_000).toFixed(1)}ms`;
  return `${(ns / 1_000_000_000).toFixed(2)}s`;
}

function getLatencyColor(ns: number): string {
  if (ns < 1_000) return "var(--state-success)";
  if (ns < 100_000) return "var(--viz-seq-mid)";
  if (ns < 10_000_000) return "var(--viz-seq-high)";
  return "var(--state-error)";
}

// ── Component ──────────────────────────────────────────────────

export default function P95LatencyCalculator() {
  const setActiveModule = useUIStore((s) => s.setActiveModule);
  const [selectedDsId, setSelectedDsId] = useState("hash-map");
  const [operation, setOperation] = useState<Operation>("lookup");
  const [dataSizeIndex, setDataSizeIndex] = useState(3);

  const dataSize = DATA_SIZES[dataSizeIndex];

  const selectedDs = useMemo(
    () => DS_PROFILES.find((d) => d.id === selectedDsId) ?? DS_PROFILES[0],
    [selectedDsId],
  );

  // Compute comparison table
  const comparison = useMemo(() => {
    return DS_PROFILES.map((ds) => {
      const medianNs = ds.baseNs[operation](dataSize.value);
      const p95Ns = medianNs * ds.p95Multiplier;
      return {
        id: ds.id,
        name: ds.name,
        complexity: ds.complexities[operation],
        medianNs,
        p95Ns,
        isSelected: ds.id === selectedDsId,
      };
    });
  }, [operation, dataSize.value, selectedDsId]);

  const maxP95 = useMemo(
    () => Math.max(...comparison.map((c) => c.p95Ns), 1),
    [comparison],
  );

  return (
    <div
      className={cn(
        "rounded-lg border p-5",
        "bg-[var(--surface)] border-[var(--border)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5" style={{ color: "var(--primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          P95 Latency Calculator
        </h3>
      </div>

      {/* Controls row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
            Data Structure
          </label>
          <select
            value={selectedDsId}
            onChange={(e) => setSelectedDsId(e.target.value)}
            className={cn(
              "w-full rounded-md border px-3 py-2 text-sm",
              "bg-[var(--surface-elevated)] border-[var(--border)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--ring)]",
            )}
            style={{ color: "var(--foreground)" }}
          >
            {DS_PROFILES.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
            Operation
          </label>
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value as Operation)}
            className={cn(
              "w-full rounded-md border px-3 py-2 text-sm",
              "bg-[var(--surface-elevated)] border-[var(--border)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--ring)]",
            )}
            style={{ color: "var(--foreground)" }}
          >
            {OPERATIONS.map((op) => (
              <option key={op.id} value={op.id}>
                {op.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data size slider */}
      <div className="mb-5">
        <label className="block text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
          Data Size: <span style={{ color: "var(--foreground)" }}>{dataSize.label} records</span>
        </label>
        <input
          type="range"
          min={0}
          max={DATA_SIZES.length - 1}
          value={dataSizeIndex}
          onChange={(e) => setDataSizeIndex(Number(e.target.value))}
          className="w-full accent-[var(--primary)]"
        />
        <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--foreground-muted)" }}>
          {DATA_SIZES.map((ds) => (
            <span key={ds.label}>{ds.label}</span>
          ))}
        </div>
      </div>

      {/* Result highlight */}
      {(() => {
        const sel = comparison.find((c) => c.isSelected);
        if (!sel) return null;
        return (
          <div
            className="rounded-md border p-4 mb-4 flex items-center gap-4"
            style={{ background: "var(--violet-2)", borderColor: "var(--primary)" }}
          >
            <Timer className="h-6 w-6 shrink-0" style={{ color: "var(--primary)" }} />
            <div className="flex-1">
              <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                {sel.name} {operation} @ {dataSize.label}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-lg font-bold font-mono" style={{ color: getLatencyColor(sel.p95Ns) }}>
                  {formatLatency(sel.p95Ns)}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--gray-4)", color: "var(--foreground-muted)" }}>
                  P95
                </span>
                <span className="text-xs font-mono" style={{ color: "var(--foreground-muted)" }}>
                  (median: {formatLatency(sel.medianNs)})
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Comparison table */}
      <div className="space-y-1.5">
        <div className="flex items-center text-[10px] px-2 mb-1" style={{ color: "var(--foreground-muted)" }}>
          <span className="w-28">Data Structure</span>
          <span className="w-20">Complexity</span>
          <span className="flex-1">P95 Latency</span>
          <span className="w-16 text-right">Value</span>
        </div>
        {comparison.map((row) => {
          const barPct = Math.max((Math.log10(row.p95Ns + 1) / Math.log10(maxP95 + 1)) * 100, 2);
          return (
            <motion.div
              key={row.id}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md",
                row.isSelected ? "ring-1 ring-[var(--primary)]" : "",
              )}
              style={{
                background: row.isSelected ? "var(--gray-4)" : "var(--gray-3)",
              }}
            >
              <span
                className="w-28 text-xs truncate"
                style={{ color: row.isSelected ? "var(--foreground)" : "var(--foreground-muted)" }}
              >
                {row.name}
              </span>
              <span className="w-20 text-[10px] font-mono" style={{ color: "var(--foreground-muted)" }}>
                {row.complexity}
              </span>
              <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "var(--gray-5)" }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${barPct}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ background: getLatencyColor(row.p95Ns) }}
                />
              </div>
              <span
                className="w-16 text-right text-xs font-mono shrink-0"
                style={{ color: getLatencyColor(row.p95Ns) }}
              >
                {formatLatency(row.p95Ns)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Bridge */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "mt-4 w-full flex items-center justify-center gap-2",
          "rounded-md px-4 py-2.5 text-sm font-medium",
          "bg-[var(--primary)] text-[var(--primary-foreground)]",
          "hover:bg-[var(--primary-hover)] transition-colors",
        )}
        onClick={() => {
          setActiveModule("system-design");
        }}
      >
        <Zap className="h-4 w-4" />
        Switch to System Design &rarr;
        <ChevronRight className="h-4 w-4" />
      </motion.button>
    </div>
  );
}
