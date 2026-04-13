"use client";

import React, { memo, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Play, RotateCcw, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────

interface TrafficTick {
  tick: number;
  legitimateRps: number;
  attackRps: number;
  totalRps: number;
  mitigationActive: boolean;
  blocked: number;
  passed: number;
  serverLoad: number;
  status: "normal" | "elevated" | "under-attack" | "mitigating" | "recovered";
  description: string;
}

// ── Simulation ─────────────────────────────────────────────

const PHASES = [
  { start: 0, end: 4, legit: 50, attack: 0, label: "normal" },
  { start: 5, end: 7, legit: 50, attack: 100, label: "ramp-up" },
  { start: 8, end: 14, legit: 50, attack: 400, label: "peak-attack" },
  { start: 15, end: 18, legit: 50, attack: 400, label: "mitigation-on" },
  { start: 19, end: 22, legit: 50, attack: 200, label: "diminishing" },
  { start: 23, end: 27, legit: 50, attack: 10, label: "recovery" },
] as const;

function simulateDDoS(
  serverCapacity: number,
  mitigationThreshold: number,
): TrafficTick[] {
  const ticks: TrafficTick[] = [];
  let mitigationActive = false;

  for (let tick = 0; tick <= 27; tick++) {
    const phase = PHASES.find((p) => tick >= p.start && tick <= p.end);
    if (!phase) continue;

    const legit = phase.legit;
    const attack = Math.max(0, phase.attack);
    const total = legit + attack;

    if (total > mitigationThreshold && !mitigationActive) {
      mitigationActive = true;
    }
    if (mitigationActive && total < mitigationThreshold * 0.5) {
      mitigationActive = false;
    }

    const blocked = mitigationActive ? Math.min(attack, total) : 0;
    const passed = total - blocked;
    const serverLoad = Math.min(100, Math.round((passed / serverCapacity) * 100));

    let status: TrafficTick["status"];
    if (mitigationActive) {
      status = serverLoad > 80 ? "under-attack" : "mitigating";
    } else if (serverLoad > 90) {
      status = "under-attack";
    } else if (serverLoad > 60) {
      status = "elevated";
    } else if (tick > 22) {
      status = "recovered";
    } else {
      status = "normal";
    }

    const descriptions: Record<string, string> = {
      normal: `Normal traffic: ${legit} req/s, server healthy`,
      "ramp-up": `Attack ramping up: +${attack} malicious req/s detected`,
      "peak-attack": mitigationActive
        ? `DDoS mitigation active: blocking ${blocked} req/s, ${passed} passed`
        : `UNDER ATTACK: ${total} req/s overwhelming server (capacity: ${serverCapacity})`,
      "mitigation-on": `Mitigation engaged: ${blocked} blocked, server load ${serverLoad}%`,
      diminishing: `Attack diminishing: ${attack} attack req/s remaining`,
      recovery: `Recovering: traffic normalizing, server load ${serverLoad}%`,
    };

    ticks.push({
      tick,
      legitimateRps: legit,
      attackRps: attack,
      totalRps: total,
      mitigationActive,
      blocked,
      passed,
      serverLoad,
      status,
      description: descriptions[phase.label] ?? "",
    });
  }

  return ticks;
}

// ── Constants ──────────────────────────────────────────────

const STATUS_BG: Record<TrafficTick["status"], string> = {
  normal: "bg-emerald-500/15",
  elevated: "bg-yellow-500/15",
  "under-attack": "bg-red-500/15",
  mitigating: "bg-blue-500/15",
  recovered: "bg-emerald-500/15",
};

const STATUS_TEXT: Record<TrafficTick["status"], string> = {
  normal: "text-emerald-400",
  elevated: "text-yellow-400",
  "under-attack": "text-red-400",
  mitigating: "text-blue-400",
  recovered: "text-emerald-400",
};

const STATUS_LABELS: Record<TrafficTick["status"], string> = {
  normal: "Normal",
  elevated: "Elevated",
  "under-attack": "Under Attack",
  mitigating: "Mitigating",
  recovered: "Recovered",
};

const TIMELINE_BG: Record<TrafficTick["status"], string> = {
  normal: "bg-emerald-500",
  elevated: "bg-yellow-500",
  "under-attack": "bg-red-500",
  mitigating: "bg-blue-500",
  recovered: "bg-emerald-500",
};

// ── Component ──────────────────────────────────────────────

function DDoSSimulationVisualizerInner() {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const serverCapacity = 200;
  const mitigationThreshold = 250;

  const ticks = useMemo(
    () => simulateDDoS(serverCapacity, mitigationThreshold),
    [],
  );
  const maxSteps = ticks.length - 1;
  const current = ticks[stepIndex];

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
    }, 600);
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-2">
        <Shield className="h-3.5 w-3.5 text-foreground-muted" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          DDoS Simulation
        </h3>
        <span
          className={cn(
            "ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold",
            STATUS_BG[current.status],
            STATUS_TEXT[current.status],
          )}
        >
          {STATUS_LABELS[current.status]}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {/* Traffic bars */}
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Traffic (req/s)
          </p>
          <div className="space-y-1.5">
            <div>
              <div className="mb-0.5 flex items-center justify-between text-[10px]">
                <span className="text-emerald-400">Legitimate</span>
                <span className="text-foreground-muted">{current.legitimateRps}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800">
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${Math.min(100, (current.legitimateRps / 500) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-0.5 flex items-center justify-between text-[10px]">
                <span className="text-red-400">Attack</span>
                <span className="text-foreground-muted">{current.attackRps}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800">
                <div
                  className="h-2 rounded-full bg-red-500 transition-all"
                  style={{
                    width: `${Math.min(100, (current.attackRps / 500) * 100)}%`,
                  }}
                />
              </div>
            </div>
            {current.mitigationActive && (
              <div>
                <div className="mb-0.5 flex items-center justify-between text-[10px]">
                  <span className="text-blue-400">Blocked</span>
                  <span className="text-foreground-muted">{current.blocked}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{
                      width: `${Math.min(100, (current.blocked / 500) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Server load gauge */}
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Server Load
          </p>
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                current.serverLoad > 90
                  ? "bg-red-500"
                  : current.serverLoad > 60
                    ? "bg-yellow-500"
                    : "bg-emerald-500",
              )}
              style={{ width: `${current.serverLoad}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
              {current.serverLoad}%
            </span>
          </div>
        </div>

        {/* Mitigation indicator */}
        {current.mitigationActive && (
          <div className="mb-3 flex items-center gap-2 rounded-md bg-blue-500/10 px-2.5 py-1.5 text-xs text-blue-400">
            <Shield className="h-3.5 w-3.5" />
            DDoS mitigation active
          </div>
        )}

        {/* Step description */}
        <p className="text-xs text-foreground-muted">{current.description}</p>

        {/* Mini timeline */}
        <div className="mt-3">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Timeline
          </p>
          <div className="flex gap-px">
            {ticks.map((t, i) => (
              <button
                key={t.tick}
                type="button"
                className={cn(
                  "h-3 flex-1 rounded-sm transition-all",
                  i <= stepIndex ? TIMELINE_BG[t.status] : "bg-zinc-800",
                  i === stepIndex && "ring-1 ring-white/50",
                )}
                onClick={() => {
                  setPlaying(false);
                  setStepIndex(i);
                }}
              />
            ))}
          </div>
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

const DDoSSimulationVisualizer = memo(DDoSSimulationVisualizerInner);
export default DDoSSimulationVisualizer;
