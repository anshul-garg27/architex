"use client";

// ─────────────────────────────────────────────────────────────
// Architex — Simulation Score Panel (CROSS-007)
// Displays simulation-based scoring in the interview module.
// ─────────────────────────────────────────────────────────────

import { memo, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  RefreshCw,
  Shield,
  Clock,
  Zap,
  DollarSign,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SimulationScore } from "@/lib/cross-module/interview-simulator-bridge";

// ── Props ─────────────────────────────────────────────────────

interface SimulationScorePanelProps {
  spofs: string[];
  score: SimulationScore;
  feedback: string[];
  onSimulateAgain: () => void;
  className?: string;
}

// ── Grade badge config ────────────────────────────────────────

const GRADE_CONFIG: Record<
  SimulationScore["grade"],
  { label: string; color: string; bg: string }
> = {
  excellent: { label: "Strong Hire", color: "#22C55E", bg: "#22C55E20" },
  good: { label: "Hire", color: "#3B82F6", bg: "#3B82F620" },
  adequate: { label: "Borderline", color: "#F59E0B", bg: "#F59E0B20" },
  poor: { label: "No Hire", color: "#EF4444", bg: "#EF444420" },
};

export const SimulationScorePanel = memo(function SimulationScorePanel({
  spofs,
  score,
  feedback,
  onSimulateAgain,
  className,
}: SimulationScorePanelProps) {
  const gradeInfo = GRADE_CONFIG[score.grade];

  const metrics = useMemo(
    () => [
      {
        icon: Shield,
        label: "Availability",
        value: `${score.availabilityPercent.toFixed(2)}%`,
        good: score.availabilityPercent >= 99.5,
      },
      {
        icon: Clock,
        label: "P99 Latency",
        value: `${score.p99LatencyMs}ms`,
        good: score.p99LatencyMs < 500,
      },
      {
        icon: Activity,
        label: "Peak Error Rate",
        value: `${(score.peakErrorRate * 100).toFixed(1)}%`,
        good: score.peakErrorRate < 0.05,
      },
      {
        icon: Zap,
        label: "Peak RPS",
        value: score.peakRps.toLocaleString(),
        good: true,
      },
      {
        icon: DollarSign,
        label: "Cost / 1K reqs",
        value: `$${score.costEfficiency.toFixed(4)}`,
        good: score.costEfficiency < 0.5,
      },
      {
        icon: AlertTriangle,
        label: "Incidents",
        value: String(score.incidentCount),
        good: score.incidentCount === 0,
      },
    ],
    [score],
  );

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]",
        className,
      )}
    >
      {/* Header with grade badge */}
      <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-4 py-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[var(--text-accent)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Simulation Score
          </h3>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{ color: gradeInfo.color, backgroundColor: gradeInfo.bg }}
        >
          {gradeInfo.label}
        </span>
      </div>

      <div className="space-y-4 p-4">
        {/* SPOF highlights */}
        {spofs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Single Points of Failure
            </p>
            <div className="space-y-1.5">
              {spofs.map((spof) => (
                <div
                  key={spof}
                  className="flex items-start gap-2 rounded-md bg-red-500/10 px-2.5 py-1.5 text-xs"
                >
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                  <span className="text-[var(--text-secondary)]">{spof}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {spofs.length === 0 && (
          <div className="flex items-center gap-2 rounded-md bg-green-500/10 px-2.5 py-1.5 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
            <span className="text-[var(--text-secondary)]">
              No single points of failure detected
            </span>
          </div>
        )}

        {/* Metrics grid */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
            Simulation Metrics
          </p>
          <div className="grid grid-cols-2 gap-2">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="flex items-center gap-2 rounded-md bg-[var(--bg-secondary)] px-2.5 py-2 text-xs"
              >
                <m.icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    m.good ? "text-green-400" : "text-amber-400",
                  )}
                />
                <div className="min-w-0">
                  <p className="text-[var(--text-tertiary)]">{m.label}</p>
                  <p className="font-mono font-medium text-[var(--text-primary)]">
                    {m.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback */}
        {feedback.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Auto-Generated Feedback
            </p>
            <ul className="space-y-1.5">
              {feedback.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
                >
                  <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--text-tertiary)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Simulate again button */}
        <button
          type="button"
          onClick={onSimulateAgain}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
            "border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
            "hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
            "transition-colors",
          )}
        >
          <RefreshCw className="h-4 w-4" />
          Simulate Again
        </button>
      </div>
    </div>
  );
});
