"use client";

import React, { memo, useState, useCallback, useMemo } from "react";
import { X, Calculator, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

// ── Types ──────────────────────────────────────────────────

interface EstimationInputs {
  dau: number;
  requestsPerUserPerDay: number;
  peakMultiplier: number;
  readWriteRatio: number; // reads per write (e.g. 10 = 10:1)
  avgObjectSizeKB: number;
}

interface ComputedMetrics {
  avgRps: number;
  peakRps: number;
  writeRps: number;
  readRps: number;
  peakWriteRps: number;
  peakReadRps: number;
  storagePerYearTB: number;
  bandwidthMbps: number;
}

// ── Reference presets ──────────────────────────────────────

interface Preset {
  label: string;
  values: Partial<EstimationInputs>;
}

const PRESETS: Preset[] = [
  {
    label: "1M users",
    values: { dau: 1_000_000, requestsPerUserPerDay: 10 },
  },
  {
    label: "10M users",
    values: { dau: 10_000_000, requestsPerUserPerDay: 10 },
  },
  {
    label: "100M users",
    values: { dau: 100_000_000, requestsPerUserPerDay: 5 },
  },
  {
    label: "1B tweets/day",
    values: { dau: 500_000_000, requestsPerUserPerDay: 2, avgObjectSizeKB: 1 },
  },
  {
    label: "500hrs video/min",
    values: {
      dau: 2_000_000_000,
      requestsPerUserPerDay: 5,
      avgObjectSizeKB: 50_000,
    },
  },
];

// ── Formatting helpers ─────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(1);
}

function formatRps(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

// ── Component ──────────────────────────────────────────────

const DEFAULT_INPUTS: EstimationInputs = {
  dau: 1_000_000,
  requestsPerUserPerDay: 10,
  peakMultiplier: 3,
  readWriteRatio: 10,
  avgObjectSizeKB: 10,
};

const EstimationPad = memo(function EstimationPad() {
  const isOpen = useUIStore((s) => s.estimationPadOpen);
  const setOpen = useUIStore((s) => s.setEstimationPadOpen);
  const [inputs, setInputs] = useState<EstimationInputs>(DEFAULT_INPUTS);

  const computed = useMemo<ComputedMetrics>(() => {
    const totalRequestsPerDay = inputs.dau * inputs.requestsPerUserPerDay;
    const avgRps = totalRequestsPerDay / 86_400;
    const peakRps = avgRps * inputs.peakMultiplier;

    const ratio = inputs.readWriteRatio;
    const writeFraction = 1 / (1 + ratio);
    const readFraction = ratio / (1 + ratio);

    const writeRps = avgRps * writeFraction;
    const readRps = avgRps * readFraction;
    const peakWriteRps = peakRps * writeFraction;
    const peakReadRps = peakRps * readFraction;

    // Storage: writes per day * object size * 365
    const writesPerDay = totalRequestsPerDay * writeFraction;
    const storagePerYearTB =
      (writesPerDay * inputs.avgObjectSizeKB * 365) / (1024 * 1024 * 1024);

    // Bandwidth: peak RPS * object size
    const bandwidthMbps = (peakRps * inputs.avgObjectSizeKB * 8) / 1024;

    return {
      avgRps,
      peakRps,
      writeRps,
      readRps,
      peakWriteRps,
      peakReadRps,
      storagePerYearTB,
      bandwidthMbps,
    };
  }, [inputs]);

  const updateField = useCallback(
    (field: keyof EstimationInputs, value: string) => {
      const num = parseFloat(value);
      if (!isNaN(num) && num >= 0) {
        setInputs((prev) => ({ ...prev, [field]: num }));
      }
    },
    [],
  );

  const applyPreset = useCallback((preset: Preset) => {
    setInputs((prev) => ({ ...prev, ...preset.values }));
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="absolute bottom-4 right-4 z-50 flex w-80 flex-col rounded-lg border border-border bg-background/95 shadow-2xl backdrop-blur-md"
      style={{ maxHeight: "calc(100vh - 120px)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <GripVertical className="h-3.5 w-3.5 text-foreground-subtle" />
        <Calculator className="h-3.5 w-3.5 text-primary" />
        <span className="flex-1 text-xs font-semibold text-foreground">
          Estimation Scratch Pad
        </span>
        <button
          onClick={() => setOpen(false)}
          className="rounded p-0.5 text-foreground-muted hover:bg-elevated hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* Preset chips */}
        <div className="mb-3">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
            Quick Fill
          </span>
          <div className="flex flex-wrap gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="rounded-full border border-border bg-elevated px-2 py-0.5 text-[10px] font-medium text-foreground-muted transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input fields */}
        <div className="mb-3 space-y-2">
          <InputRow
            label="DAU"
            value={inputs.dau}
            onChange={(v) => updateField("dau", v)}
            suffix="users"
          />
          <InputRow
            label="Req/user/day"
            value={inputs.requestsPerUserPerDay}
            onChange={(v) => updateField("requestsPerUserPerDay", v)}
            suffix="req"
          />
          <InputRow
            label="Peak multiplier"
            value={inputs.peakMultiplier}
            onChange={(v) => updateField("peakMultiplier", v)}
            suffix="x"
          />
          <InputRow
            label="Read:Write ratio"
            value={inputs.readWriteRatio}
            onChange={(v) => updateField("readWriteRatio", v)}
            suffix=":1"
          />
          <InputRow
            label="Avg object size"
            value={inputs.avgObjectSizeKB}
            onChange={(v) => updateField("avgObjectSizeKB", v)}
            suffix="KB"
          />
        </div>

        {/* Computed metrics */}
        <div className="rounded-md border border-border bg-elevated/50 p-2">
          <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
            Computed Estimates
          </span>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            <MetricRow label="Avg RPS" value={formatRps(computed.avgRps)} />
            <MetricRow label="Peak RPS" value={formatRps(computed.peakRps)} highlight />
            <MetricRow
              label="Read RPS"
              value={formatRps(computed.readRps)}
            />
            <MetricRow
              label="Write RPS"
              value={formatRps(computed.writeRps)}
            />
            <MetricRow
              label="Peak Read RPS"
              value={formatRps(computed.peakReadRps)}
            />
            <MetricRow
              label="Peak Write RPS"
              value={formatRps(computed.peakWriteRps)}
            />
            <MetricRow
              label="Storage/year"
              value={
                computed.storagePerYearTB >= 1000
                  ? `${(computed.storagePerYearTB / 1000).toFixed(1)} PB`
                  : `${computed.storagePerYearTB.toFixed(1)} TB`
              }
              highlight
            />
            <MetricRow
              label="Bandwidth"
              value={
                computed.bandwidthMbps >= 1000
                  ? `${(computed.bandwidthMbps / 1000).toFixed(1)} Gbps`
                  : `${computed.bandwidthMbps.toFixed(1)} Mbps`
              }
            />
          </div>
        </div>

        {/* Quick reference */}
        <div className="mt-2 rounded-md bg-primary/5 px-2 py-1.5 text-[10px] text-foreground-muted">
          <span className="font-medium text-foreground-subtle">Tip: </span>
          86,400 sec/day &middot; 2.5M sec/month &middot; 1 KB = 8 Kb &middot;
          1 TB = 10<sup>12</sup> B
        </div>
      </div>

      {/* Footer shortcut hint */}
      <div className="border-t border-border px-3 py-1.5 text-center text-[10px] text-foreground-subtle">
        <kbd className="rounded border border-border bg-elevated px-1 py-0.5 font-mono text-[9px]">
          Cmd+Shift+E
        </kbd>{" "}
        to toggle
      </div>
    </div>
  );
});

// ── Sub-components ─────────────────────────────────────────

function InputRow({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
  suffix: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-[11px] text-foreground-muted">
        {label}
      </span>
      <div className="relative flex-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-full rounded border border-border bg-background px-2 pr-8 text-right text-[11px] text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-foreground-subtle">
          {suffix}
        </span>
      </div>
      <span className="w-12 text-right text-[10px] font-medium text-foreground-subtle">
        {formatNumber(value)}
      </span>
    </div>
  );
}

function MetricRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-foreground-muted">{label}</span>
      <span
        className={cn(
          "text-[11px] font-mono font-medium",
          highlight ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export default EstimationPad;
