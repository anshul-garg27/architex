"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Activity, Timer, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlgorithmConfig } from "@/lib/algorithms";

// ── Types ──────────────────────────────────────────────────────

type ComplexityClass =
  | "O(1)"
  | "O(log n)"
  | "O(n)"
  | "O(n log n)"
  | "O(n^2)"
  | "O(n^3)"
  | "O(2^n)"
  | "O(n!)"
  | "O(n*m)"
  | "O(V+E)"
  | "O(E log V)"
  | "O(V^2)"
  | "O(V^3)"
  | "O(V*E)"
  | "O(n*W)"
  | "O(n*k)";

interface LatencyRow {
  label: string;
  value: number;
  latencyMs: number;
}

// ── Constants ─────────────────────────────────────────────────

const DATA_SIZES = [
  { value: 1_000, label: "1K" },
  { value: 10_000, label: "10K" },
  { value: 100_000, label: "100K" },
  { value: 1_000_000, label: "1M" },
  { value: 10_000_000, label: "10M" },
];

const BASE_OP_NS = 50; // nanoseconds per base operation

// Faster alternatives for comparison suggestions
const FASTER_ALTERNATIVES: Record<string, { name: string; complexity: string }> = {
  "bubble-sort": { name: "Merge Sort", complexity: "O(n log n)" },
  "insertion-sort": { name: "Merge Sort", complexity: "O(n log n)" },
  "selection-sort": { name: "Quick Sort", complexity: "O(n log n)" },
  "bogo-sort": { name: "Quick Sort", complexity: "O(n log n)" },
  "cocktail-shaker-sort": { name: "Tim Sort", complexity: "O(n log n)" },
  "comb-sort": { name: "Quick Sort", complexity: "O(n log n)" },
  "pancake-sort": { name: "Merge Sort", complexity: "O(n log n)" },
  "dfs": { name: "BFS (for shortest path)", complexity: "O(V+E)" },
  "bellman-ford": { name: "Dijkstra (no negative edges)", complexity: "O(E log V)" },
  "floyd-warshall": { name: "Dijkstra (per-source)", complexity: "O(V * E log V)" },
  "fibonacci-dp": { name: "Matrix Exponentiation", complexity: "O(log n)" },
  "n-queens": { name: "Constraint Propagation", complexity: "~O(n)" },
  "knapsack": { name: "Greedy Fractional Knapsack", complexity: "O(n log n)" },
  "edit-distance": { name: "Hirschberg's (space)", complexity: "O(n*m) time, O(min(n,m)) space" },
};

// ── Helpers ────────────────────────────────────────────────────

function parseComplexity(raw: string): ComplexityClass {
  const s = raw.replace(/\s/g, "").replace(/²/g, "^2").replace(/³/g, "^3");
  if (s.includes("1)") && !s.includes("n")) return "O(1)";
  if (s.includes("logn)") && !s.includes("nlog")) return "O(log n)";
  if (s.includes("nlogn") || s.includes("n*logn")) return "O(n log n)";
  if (s.includes("n^3")) return "O(n^3)";
  if (s.includes("n^2") || s.includes("n²")) return "O(n^2)";
  if (s.includes("2^n")) return "O(2^n)";
  if (s.includes("n!")) return "O(n!)";
  if (s.includes("V+E") || s.includes("V + E")) return "O(V+E)";
  if (s.includes("ElogV") || s.includes("E*logV")) return "O(E log V)";
  if (s.includes("V^3")) return "O(V^3)";
  if (s.includes("V^2")) return "O(V^2)";
  if (s.includes("V*E") || s.includes("VE")) return "O(V*E)";
  if (s.includes("n*m") || s.includes("nm") || s.includes("m*n")) return "O(n*m)";
  if (s.includes("n*W") || s.includes("nW")) return "O(n*W)";
  if (s.includes("n*k") || s.includes("nk") || s.includes("n+k")) return "O(n*k)";
  if (/O\(n\)/.test(s) || s === "O(n)") return "O(n)";
  // Fallback: treat as linear
  return "O(n)";
}

function computeOps(complexity: ComplexityClass, n: number): number {
  switch (complexity) {
    case "O(1)":
      return 1;
    case "O(log n)":
      return Math.log2(n);
    case "O(n)":
      return n;
    case "O(n log n)":
      return n * Math.log2(n);
    case "O(n^2)":
      return n * n;
    case "O(n^3)":
      return n * n * n;
    case "O(2^n)":
      return Math.pow(2, Math.min(n, 40));
    case "O(n!)":
      // Cap at n=20 to avoid Infinity
      return n <= 20 ? Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => a * b, 1) : Infinity;
    // Graph-like: treat n as both V and E (E ~ n for sparse)
    case "O(V+E)":
      return 2 * n;
    case "O(E log V)":
      return n * Math.log2(n);
    case "O(V^2)":
      return n * n;
    case "O(V^3)":
      return n * n * n;
    case "O(V*E)":
      return n * n;
    // DP-like: treat as quadratic
    case "O(n*m)":
    case "O(n*W)":
      return n * n;
    case "O(n*k)":
      return n * Math.sqrt(n);
    default:
      return n;
  }
}

function opsToLatencyMs(ops: number): number {
  if (!isFinite(ops)) return Infinity;
  return (ops * BASE_OP_NS) / 1_000_000;
}

function formatLatency(ms: number): string {
  if (!isFinite(ms)) return "heat death";
  if (ms < 0.001) return `${(ms * 1_000_000).toFixed(0)}ns`;
  if (ms < 1) return `${(ms * 1_000).toFixed(1)}us`;
  if (ms < 1_000) return `${ms.toFixed(1)}ms`;
  if (ms < 60_000) return `${(ms / 1_000).toFixed(1)}s`;
  if (ms < 3_600_000) return `${(ms / 60_000).toFixed(1)}min`;
  if (ms < 86_400_000) return `${(ms / 3_600_000).toFixed(1)}hr`;
  return `${(ms / 86_400_000).toFixed(0)}d`;
}

type ImpactLevel = "green" | "amber" | "red";

function getImpactLevel(ms: number): ImpactLevel {
  if (!isFinite(ms)) return "red";
  if (ms < 1) return "green";
  if (ms <= 50) return "amber";
  return "red";
}

function getImpactColor(level: ImpactLevel): string {
  switch (level) {
    case "green":
      return "var(--state-success)";
    case "amber":
      return "var(--state-warning)";
    case "red":
      return "var(--state-error)";
  }
}

function getImpactLabel(level: ImpactLevel): string {
  switch (level) {
    case "green":
      return "< 1ms";
    case "amber":
      return "1-50ms";
    case "red":
      return "> 50ms";
  }
}

function getImpactDescription(level: ImpactLevel): string {
  switch (level) {
    case "green":
      return "Negligible impact. Safe for hot paths and real-time systems.";
    case "amber":
      return "Noticeable latency. Acceptable for batch jobs, risky for real-time.";
    case "red":
      return "Significant delay. Will degrade user experience or block pipelines.";
  }
}

// ── Component ──────────────────────────────────────────────────

interface LatencyBridgePanelProps {
  config: AlgorithmConfig | null;
}

export default function LatencyBridgePanel({ config }: LatencyBridgePanelProps) {
  const complexity = useMemo(
    () => (config ? parseComplexity(config.timeComplexity.average) : "O(n)"),
    [config],
  );

  const rows: LatencyRow[] = useMemo(() => {
    return DATA_SIZES.map((ds) => {
      const ops = computeOps(complexity, ds.value);
      const ms = opsToLatencyMs(ops);
      return { label: ds.label, value: ds.value, latencyMs: ms };
    });
  }, [complexity]);

  // For log-scale bar widths
  const maxLog = useMemo(() => {
    const finite = rows.filter((r) => isFinite(r.latencyMs));
    if (finite.length === 0) return 1;
    return Math.max(...finite.map((r) => Math.log10(r.latencyMs + 0.0001)), 1);
  }, [rows]);

  // Find the "danger zone" threshold row
  const dangerIndex = rows.findIndex((r) => getImpactLevel(r.latencyMs) === "red");

  // Comparison at 1M
  const at1M = rows.find((r) => r.label === "1M");
  const alternative = config ? FASTER_ALTERNATIVES[config.id] : null;
  const altLatencyAt1M = useMemo(() => {
    if (!alternative) return null;
    const altComplexity = parseComplexity(alternative.complexity);
    const ops = computeOps(altComplexity, 1_000_000);
    return opsToLatencyMs(ops);
  }, [alternative]);

  if (!config) {
    return (
      <div className="flex items-center justify-center h-full px-4 py-8">
        <div className="text-center">
          <Activity
            className="mx-auto h-8 w-8 opacity-20"
            style={{ color: "var(--foreground-muted)" }}
          />
          <p
            className="mt-3 text-sm"
            style={{ color: "var(--foreground-muted)" }}
          >
            Select an algorithm to see its latency profile at scale.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" style={{ color: "var(--primary)" }} />
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {config.name}
          </h3>
        </div>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={{
            background: "var(--gray-4)",
            color: "var(--primary)",
          }}
        >
          avg {config.timeComplexity.average}
        </span>
        <span
          className="ml-auto text-[10px] px-2 py-0.5 rounded"
          style={{
            background: "var(--violet-3)",
            color: "var(--primary)",
          }}
        >
          Latency at Scale
        </span>
      </div>

      {/* Complexity trio */}
      <div className="grid grid-cols-3 gap-2">
        {(["best", "average", "worst"] as const).map((k) => (
          <div
            key={k}
            className="rounded-md border px-3 py-2 text-center"
            style={{
              background: "var(--gray-3)",
              borderColor:
                k === "average" ? "var(--primary)" : "var(--border)",
            }}
          >
            <span
              className="block text-[10px] uppercase tracking-wider mb-0.5"
              style={{ color: "var(--foreground-muted)" }}
            >
              {k}
            </span>
            <span
              className="block text-xs font-mono font-semibold"
              style={{
                color:
                  k === "average" ? "var(--primary)" : "var(--foreground)",
              }}
            >
              {config.timeComplexity[k]}
            </span>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: "var(--foreground-muted)" }}
          >
            Data Size
          </span>
          <span
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: "var(--foreground-muted)" }}
          >
            Estimated Latency
          </span>
        </div>
        <AnimatePresence mode="popLayout">
          {rows.map((row, i) => {
            const level = getImpactLevel(row.latencyMs);
            const color = getImpactColor(level);
            const widthPct = isFinite(row.latencyMs)
              ? Math.max(
                  (Math.log10(row.latencyMs + 0.0001) / maxLog) * 100,
                  3,
                )
              : 100;
            const isDanger = dangerIndex >= 0 && i >= dangerIndex;

            return (
              <motion.div
                key={`${config.id}-${row.label}`}
                layout
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 25,
                  delay: i * 0.06,
                }}
                style={{ transformOrigin: "left" }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-all",
                  isDanger
                    ? "ring-1 ring-[var(--state-error)]/30"
                    : "",
                )}
              >
                <span
                  className="w-8 text-xs font-mono shrink-0 font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {row.label}
                </span>
                <div
                  className="flex-1 h-4 rounded-full overflow-hidden relative"
                  style={{ background: "var(--gray-4)" }}
                >
                  <motion.div
                    className="h-full rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 25,
                      delay: i * 0.06 + 0.1,
                    }}
                    style={{
                      background: `linear-gradient(90deg, ${color}40, ${color})`,
                    }}
                  />
                  {isDanger && i === dangerIndex && (
                    <div
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                    >
                      <AlertTriangle
                        className="h-3 w-3"
                        style={{ color: "var(--state-error)" }}
                      />
                    </div>
                  )}
                </div>
                <span
                  className="w-16 text-right text-xs font-mono shrink-0 font-semibold"
                  style={{ color }}
                >
                  {formatLatency(row.latencyMs)}
                </span>
                <span
                  className="w-12 text-right text-[10px] shrink-0 font-medium rounded px-1.5 py-0.5"
                  style={{
                    color,
                    background: `color-mix(in srgb, ${color} 10%, transparent)`,
                  }}
                >
                  {getImpactLabel(level)}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Impact legend */}
      <div className="flex gap-3">
        {(["green", "amber", "red"] as ImpactLevel[]).map((level) => (
          <div key={level} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: getImpactColor(level) }}
            />
            <span
              className="text-[10px]"
              style={{ color: "var(--foreground-muted)" }}
            >
              {getImpactLabel(level)}
            </span>
          </div>
        ))}
      </div>

      {/* Comparison callout */}
      {at1M && alternative && altLatencyAt1M !== null && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg border p-3"
          style={{
            background: "var(--gray-3)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-start gap-2.5">
            <TrendingUp
              className="h-4 w-4 mt-0.5 shrink-0"
              style={{ color: "var(--primary)" }}
            />
            <div>
              <p
                className="text-xs font-medium mb-1"
                style={{ color: "var(--foreground)" }}
              >
                At 1M elements
              </p>
              <p
                className="text-[11px] leading-relaxed"
                style={{ color: "var(--foreground-muted)" }}
              >
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                  {config.name}
                </span>{" "}
                takes ~
                <span
                  className="font-mono font-semibold"
                  style={{ color: getImpactColor(getImpactLevel(at1M.latencyMs)) }}
                >
                  {formatLatency(at1M.latencyMs)}
                </span>
                . A faster alternative (
                <span className="font-semibold" style={{ color: "var(--state-success)" }}>
                  {alternative.name}
                </span>
                ) would take ~
                <span
                  className="font-mono font-semibold"
                  style={{ color: getImpactColor(getImpactLevel(altLatencyAt1M)) }}
                >
                  {formatLatency(altLatencyAt1M)}
                </span>
                .
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Impact summary */}
      {at1M && (
        <div
          className="rounded-md border p-3 flex items-start gap-2.5"
          style={{
            background: "var(--gray-3)",
            borderColor: "var(--border)",
          }}
        >
          <Timer
            className="h-4 w-4 mt-0.5 shrink-0"
            style={{ color: getImpactColor(getImpactLevel(at1M.latencyMs)) }}
          />
          <p
            className="text-[11px] leading-relaxed"
            style={{ color: "var(--foreground-muted)" }}
          >
            {getImpactDescription(getImpactLevel(at1M.latencyMs))}
          </p>
        </div>
      )}
    </div>
  );
}
