"use client";

import {
  memo,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  type ChangeEvent,
} from "react";
import {
  X,
  Calculator,
  Download,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StepKind = "input" | "computed";

interface CalcStep {
  /** Unique key for this step */
  id: string;
  /** Human-readable label */
  label: string;
  /** Operator shown before this line (none for first) */
  operator?: string;
  /** The kind of step */
  kind: StepKind;
  /** For input steps: the numeric value (editable) */
  value?: number;
  /** For input steps: min/max/step constraints */
  min?: number;
  max?: number;
  step?: number;
  /** Suffix text (e.g., "seconds/day") */
  suffix?: string;
  /** Compute function: given all current input values, produce the output */
  compute?: (inputs: Record<string, number>) => number;
}

interface CalcCategory {
  id: string;
  label: string;
  steps: CalcStep[];
}

interface Preset {
  id: string;
  label: string;
  values: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

const PRESETS: Preset[] = [
  {
    id: "social-media",
    label: "Social Media App",
    values: {
      dau: 10_000_000,
      reqPerUser: 50,
      peakMultiplier: 3,
      readWriteRatio: 10,
      avgRequestKB: 2,
      avgResponseKB: 5,
      retentionYears: 3,
      rpsPerServer: 15_000,
      costPerServer: 150,
    },
  },
  {
    id: "messaging",
    label: "Messaging System",
    values: {
      dau: 50_000_000,
      reqPerUser: 200,
      peakMultiplier: 5,
      readWriteRatio: 1,
      avgRequestKB: 1,
      avgResponseKB: 1,
      retentionYears: 5,
      rpsPerServer: 30_000,
      costPerServer: 150,
    },
  },
  {
    id: "video-streaming",
    label: "Video Streaming",
    values: {
      dau: 5_000_000,
      reqPerUser: 20,
      peakMultiplier: 4,
      readWriteRatio: 100,
      avgRequestKB: 1,
      avgResponseKB: 500,
      retentionYears: 2,
      rpsPerServer: 8_000,
      costPerServer: 200,
    },
  },
  {
    id: "e-commerce",
    label: "E-commerce",
    values: {
      dau: 2_000_000,
      reqPerUser: 30,
      peakMultiplier: 10,
      readWriteRatio: 20,
      avgRequestKB: 3,
      avgResponseKB: 10,
      retentionYears: 5,
      rpsPerServer: 15_000,
      costPerServer: 150,
    },
  },
];

// ---------------------------------------------------------------------------
// Category / step definitions
// ---------------------------------------------------------------------------

function buildCategories(): CalcCategory[] {
  return [
    {
      id: "traffic",
      label: "Traffic",
      steps: [
        {
          id: "dau",
          label: "DAU (Daily Active Users)",
          kind: "input",
          value: 10_000_000,
          min: 1,
          max: 10_000_000_000,
          step: 1_000,
        },
        {
          id: "reqPerUser",
          label: "Requests/user/day",
          kind: "input",
          operator: "\u00d7",
          value: 50,
          min: 1,
          max: 10_000,
          step: 1,
        },
        {
          id: "dailyRequests",
          label: "Daily requests",
          kind: "computed",
          operator: "=",
          compute: (v) => v.dau * v.reqPerUser,
        },
        {
          id: "secondsPerDay",
          label: "seconds/day",
          kind: "computed",
          operator: "\u00f7",
          suffix: "",
          compute: () => 86_400,
        },
        {
          id: "avgRps",
          label: "Avg RPS",
          kind: "computed",
          operator: "=",
          compute: (v) => (v.dau * v.reqPerUser) / 86_400,
        },
        {
          id: "peakMultiplier",
          label: "Peak multiplier",
          kind: "input",
          operator: "\u00d7",
          value: 3,
          min: 1,
          max: 100,
          step: 0.5,
          suffix: "x",
        },
        {
          id: "peakRps",
          label: "Peak RPS",
          kind: "computed",
          operator: "=",
          compute: (v) =>
            ((v.dau * v.reqPerUser) / 86_400) * v.peakMultiplier,
        },
      ],
    },
    {
      id: "storage",
      label: "Storage",
      steps: [
        {
          id: "readWriteRatio",
          label: "Read:Write ratio",
          kind: "input",
          value: 10,
          min: 1,
          max: 1000,
          step: 1,
          suffix: ": 1",
        },
        {
          id: "writeFraction",
          label: "Write fraction",
          kind: "computed",
          operator: "=",
          compute: (v) => 1 / (v.readWriteRatio + 1),
        },
        {
          id: "avgRequestKB",
          label: "Avg request size",
          kind: "input",
          operator: "\u00d7",
          value: 2,
          min: 0.1,
          max: 10_000,
          step: 0.1,
          suffix: "KB",
        },
        {
          id: "dailyWriteRequests",
          label: "Daily write requests",
          kind: "computed",
          operator: "=",
          compute: (v) =>
            (v.dau * v.reqPerUser) / (v.readWriteRatio + 1),
        },
        {
          id: "dailyStorageGB",
          label: "Daily new storage",
          kind: "computed",
          operator: "=",
          suffix: "GB",
          compute: (v) => {
            const dailyWrites =
              (v.dau * v.reqPerUser) / (v.readWriteRatio + 1);
            return (dailyWrites * v.avgRequestKB) / (1024 * 1024);
          },
        },
        {
          id: "retentionYears",
          label: "Retention period",
          kind: "input",
          operator: "\u00d7",
          value: 3,
          min: 1,
          max: 20,
          step: 1,
          suffix: "years",
        },
        {
          id: "totalStorageTB",
          label: "Total storage",
          kind: "computed",
          operator: "=",
          suffix: "TB",
          compute: (v) => {
            const dailyWrites =
              (v.dau * v.reqPerUser) / (v.readWriteRatio + 1);
            const dailyTB =
              (dailyWrites * v.avgRequestKB) / (1024 * 1024 * 1024);
            return dailyTB * 365 * v.retentionYears;
          },
        },
      ],
    },
    {
      id: "bandwidth",
      label: "Bandwidth",
      steps: [
        {
          id: "peakRpsBw",
          label: "Peak RPS (from Traffic)",
          kind: "computed",
          compute: (v) =>
            ((v.dau * v.reqPerUser) / 86_400) * v.peakMultiplier,
        },
        {
          id: "avgResponseKB",
          label: "Avg response size",
          kind: "input",
          operator: "\u00d7",
          value: 5,
          min: 0.1,
          max: 100_000,
          step: 0.1,
          suffix: "KB",
        },
        {
          id: "bandwidthInMBps",
          label: "Inbound bandwidth",
          kind: "computed",
          operator: "=",
          suffix: "MB/s",
          compute: (v) => {
            const peakRps =
              ((v.dau * v.reqPerUser) / 86_400) * v.peakMultiplier;
            return (peakRps * v.avgRequestKB) / 1024;
          },
        },
        {
          id: "bandwidthOutMBps",
          label: "Outbound bandwidth",
          kind: "computed",
          operator: "=",
          suffix: "MB/s",
          compute: (v) => {
            const peakRps =
              ((v.dau * v.reqPerUser) / 86_400) * v.peakMultiplier;
            return (peakRps * v.avgResponseKB) / 1024;
          },
        },
      ],
    },
    {
      id: "database",
      label: "Database",
      steps: [
        {
          id: "dbWritesPerSec",
          label: "Peak writes/sec",
          kind: "computed",
          compute: (v) => {
            const peakRps =
              ((v.dau * v.reqPerUser) / 86_400) * v.peakMultiplier;
            return peakRps / (v.readWriteRatio + 1);
          },
        },
        {
          id: "dbReadsPerSec",
          label: "Peak reads/sec (raw)",
          kind: "computed",
          operator: "+",
          compute: (v) => {
            const peakRps =
              ((v.dau * v.reqPerUser) / 86_400) * v.peakMultiplier;
            return (peakRps * v.readWriteRatio) / (v.readWriteRatio + 1);
          },
        },
        {
          id: "cacheHitRate",
          label: "Est. cache hit rate",
          kind: "computed",
          operator: "\u00d7",
          suffix: "%",
          compute: (v) => {
            if (v.readWriteRatio <= 0) return 0;
            return (
              (1 - 1 / (1 + Math.log(v.readWriteRatio))) * 100
            );
          },
        },
        {
          id: "dbReadsAfterCache",
          label: "Reads/sec (after cache)",
          kind: "computed",
          operator: "=",
          compute: (v) => {
            const peakRps =
              ((v.dau * v.reqPerUser) / 86_400) * v.peakMultiplier;
            const rawReads =
              (peakRps * v.readWriteRatio) / (v.readWriteRatio + 1);
            const hitRate =
              v.readWriteRatio <= 0
                ? 0
                : 1 - 1 / (1 + Math.log(v.readWriteRatio));
            return rawReads * (1 - hitRate);
          },
        },
      ],
    },
    {
      id: "infrastructure",
      label: "Infrastructure",
      steps: [
        {
          id: "rpsPerServer",
          label: "RPS per server",
          kind: "input",
          value: 15_000,
          min: 100,
          max: 500_000,
          step: 100,
        },
        {
          id: "headroom",
          label: "Capacity headroom (70%)",
          kind: "computed",
          operator: "\u00d7",
          compute: (v) => v.rpsPerServer * 0.7,
        },
        {
          id: "peakRpsInfra",
          label: "Peak RPS",
          kind: "computed",
          operator: "\u00f7",
          compute: (v) =>
            ((v.dau * v.reqPerUser) / 86_400) * v.peakMultiplier,
        },
        {
          id: "estimatedServers",
          label: "Estimated servers",
          kind: "computed",
          operator: "=",
          compute: (v) => {
            const peakRps =
              ((v.dau * v.reqPerUser) / 86_400) * v.peakMultiplier;
            return Math.ceil(peakRps / (v.rpsPerServer * 0.7));
          },
        },
      ],
    },
    {
      id: "cost",
      label: "Cost",
      steps: [
        {
          id: "serverCount",
          label: "Servers needed",
          kind: "computed",
          compute: (v) => {
            const peakRps =
              ((v.dau * v.reqPerUser) / 86_400) * v.peakMultiplier;
            return Math.ceil(peakRps / (v.rpsPerServer * 0.7));
          },
        },
        {
          id: "costPerServer",
          label: "Cost per server/month",
          kind: "input",
          operator: "\u00d7",
          value: 150,
          min: 10,
          max: 10_000,
          step: 10,
          suffix: "USD",
        },
        {
          id: "baseServerCost",
          label: "Base server cost",
          kind: "computed",
          operator: "=",
          suffix: "USD/mo",
          compute: (v) => {
            const peakRps =
              ((v.dau * v.reqPerUser) / 86_400) * v.peakMultiplier;
            const servers = Math.ceil(peakRps / (v.rpsPerServer * 0.7));
            return servers * v.costPerServer;
          },
        },
        {
          id: "overheadMultiplier",
          label: "Overhead (LB, monitoring, etc.)",
          kind: "computed",
          operator: "\u00d7",
          suffix: "",
          compute: () => 1.2,
        },
        {
          id: "totalMonthlyCost",
          label: "Total monthly cost",
          kind: "computed",
          operator: "=",
          suffix: "USD/mo",
          compute: (v) => {
            const peakRps =
              ((v.dau * v.reqPerUser) / 86_400) * v.peakMultiplier;
            const servers = Math.ceil(peakRps / (v.rpsPerServer * 0.7));
            return Math.round(servers * v.costPerServer * 1.2);
          },
        },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function fmtNumber(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toFixed(2);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InputField({
  step,
  value,
  onChange,
}: {
  step: CalcStep;
  value: number;
  onChange: (id: string, val: number) => void;
}) {
  const [localValue, setLocalValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setLocalValue(raw);
      const parsed = parseFloat(raw);
      if (!isNaN(parsed) && parsed >= (step.min ?? 0)) {
        onChange(step.id, parsed);
      }
    },
    [onChange, step.id, step.min],
  );

  const handleBlur = useCallback(() => {
    const parsed = parseFloat(localValue);
    if (isNaN(parsed) || parsed < (step.min ?? 0)) {
      setLocalValue(String(value));
    } else {
      setLocalValue(String(parsed));
      onChange(step.id, parsed);
    }
  }, [localValue, value, onChange, step.id, step.min]);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={cn(
        "w-32 rounded-md border border-blue-500/40 bg-blue-500/10 px-2 py-1",
        "text-right text-sm font-mono font-semibold text-blue-400",
        "outline-none transition-all",
        "focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50",
        "hover:border-blue-400/60",
      )}
      aria-label={step.label}
    />
  );
}

function StepRow({
  step,
  inputValues,
  onInputChange,
}: {
  step: CalcStep;
  inputValues: Record<string, number>;
  onInputChange: (id: string, val: number) => void;
}) {
  const computedValue = step.compute ? step.compute(inputValues) : undefined;

  return (
    <div className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent/30">
      {/* Operator */}
      <span className="w-5 text-center text-sm font-mono text-foreground-muted">
        {step.operator ?? ""}
      </span>

      {/* Label */}
      <span className="min-w-[10rem] flex-1 text-sm text-foreground">
        {step.label}
        {step.suffix ? (
          <span className="ml-1 text-foreground-muted">{step.suffix}</span>
        ) : null}
      </span>

      {/* Value */}
      {step.kind === "input" ? (
        <InputField
          step={step}
          value={inputValues[step.id] ?? step.value ?? 0}
          onChange={onInputChange}
        />
      ) : (
        <span
          className={cn(
            "w-32 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1",
            "text-right text-sm font-mono font-semibold text-emerald-400",
          )}
        >
          {computedValue !== undefined ? fmtNumber(computedValue) : "--"}
        </span>
      )}
    </div>
  );
}

function CategorySection({
  category,
  inputValues,
  onInputChange,
  defaultExpanded,
}: {
  category: CalcCategory;
  inputValues: Record<string, number>;
  onInputChange: (id: string, val: number) => void;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-accent/30"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-foreground-muted" />
        ) : (
          <ChevronRight className="h-4 w-4 text-foreground-muted" />
        )}
        <span className="text-sm font-semibold text-foreground">
          {category.label}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-border px-1 py-2">
          {category.steps.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              inputValues={inputValues}
              onInputChange={onInputChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Markdown export
// ---------------------------------------------------------------------------

function generateMarkdown(
  categories: CalcCategory[],
  inputValues: Record<string, number>,
): string {
  const lines: string[] = ["# Capacity Estimation", ""];

  for (const cat of categories) {
    lines.push(`## ${cat.label}`, "");
    lines.push("| Step | Operator | Value |");
    lines.push("|------|----------|-------|");

    for (const step of cat.steps) {
      const val =
        step.kind === "input"
          ? inputValues[step.id] ?? step.value ?? 0
          : step.compute
            ? step.compute(inputValues)
            : 0;
      const suffix = step.suffix ? ` ${step.suffix}` : "";
      lines.push(
        `| ${step.label} | ${step.operator ?? ""} | ${fmtNumber(val)}${suffix} |`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const ShowYourWorkCalculator = memo(function ShowYourWorkCalculator() {
  const open = useUIStore((s) => s.capacityCalculatorOpen);
  const setOpen = useUIStore((s) => s.setCapacityCalculatorOpen);
  const [copied, setCopied] = useState(false);

  const categories = useMemo(() => buildCategories(), []);

  // Collect default input values
  const defaultInputs = useMemo(() => {
    const defaults: Record<string, number> = {};
    for (const cat of categories) {
      for (const step of cat.steps) {
        if (step.kind === "input" && step.value !== undefined) {
          defaults[step.id] = step.value;
        }
      }
    }
    return defaults;
  }, [categories]);

  const [inputValues, setInputValues] = useState<Record<string, number>>(defaultInputs);

  const handleInputChange = useCallback((id: string, val: number) => {
    setInputValues((prev) => ({ ...prev, [id]: val }));
  }, []);

  const applyPreset = useCallback(
    (preset: Preset) => {
      setInputValues({ ...defaultInputs, ...preset.values });
    },
    [defaultInputs],
  );

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  const handleExportMarkdown = useCallback(() => {
    const md = generateMarkdown(categories, inputValues);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "capacity-estimation.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [categories, inputValues]);

  const handleCopyMarkdown = useCallback(() => {
    const md = generateMarkdown(categories, inputValues);
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [categories, inputValues]);

  const handleBackdropClick = useCallback(() => setOpen(false), [setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Capacity Calculator">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Dialog */}
      <div className="absolute left-1/2 top-[5%] flex h-[90vh] w-full max-w-3xl -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2.5">
            <Calculator className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Show-Your-Work Capacity Calculator
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                copied
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-accent text-foreground-muted hover:text-foreground",
              )}
              title="Copy as markdown"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:text-foreground"
              title="Export as markdown"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Presets bar */}
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-2.5">
          <span className="text-xs font-medium text-foreground-muted">
            Presets:
          </span>
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground-muted transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-foreground"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex shrink-0 items-center gap-4 border-b border-border px-5 py-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500/60" />
            <span className="text-[11px] text-foreground-muted">
              Editable input
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500/60" />
            <span className="text-[11px] text-foreground-muted">
              Computed result
            </span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            {categories.map((cat, i) => (
              <CategorySection
                key={cat.id}
                category={cat}
                inputValues={inputValues}
                onInputChange={handleInputChange}
                defaultExpanded={i < 3}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-5 py-2">
          <p className="text-center text-xs text-foreground-subtle">
            Press{" "}
            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-sidebar px-1 text-[10px] font-medium shadow-[0_1px_0_1px_rgba(0,0,0,0.15)]">
              Esc
            </kbd>{" "}
            to close{" "}
            <span className="mx-1 text-foreground-muted">|</span>{" "}
            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-sidebar px-1 text-[10px] font-medium shadow-[0_1px_0_1px_rgba(0,0,0,0.15)]">
              &#8984;
            </kbd>
            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-sidebar px-1 text-[10px] font-medium shadow-[0_1px_0_1px_rgba(0,0,0,0.15)]">
              &#8679;
            </kbd>
            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-sidebar px-1 text-[10px] font-medium shadow-[0_1px_0_1px_rgba(0,0,0,0.15)]">
              C
            </kbd>{" "}
            to toggle
          </p>
        </div>
      </div>
    </div>
  );
});
