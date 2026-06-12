"use client";

import { memo, useId } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseConfigKey } from "./properties-derived";

// ── Types ──────────────────────────────────────────────────

export interface NumberConstraints {
  min?: number;
  max?: number;
  step?: number;
}

export type ConfigFieldType = "text" | "number" | "select" | "boolean";

export interface ConfigFieldProps {
  /** Raw config key, e.g. "processingTimeMs". */
  configKey: string;
  value: string | number | boolean;
  type: ConfigFieldType;
  options?: string[];
  numberConstraints?: NumberConstraints;
  onChange: (value: string | number | boolean) => void;
}

// ── Shared bits ────────────────────────────────────────────

interface FieldLabelProps {
  htmlFor?: string;
  label: string;
  unit?: string;
}

function FieldLabel({ htmlFor, label, unit }: FieldLabelProps) {
  return (
    <div className="mb-1 flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="truncate text-[11px] text-foreground-muted">
        {label}
      </label>
      {unit && (
        <span className="shrink-0 font-mono text-[10px] text-foreground-subtle">{unit}</span>
      )}
    </div>
  );
}

const INPUT_BASE =
  "h-7 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none transition-colors hover:border-border-strong focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/40";

// ── Numeric stepper ( − value + ) ──────────────────────────

function stepDecimals(step: number): number {
  const s = String(step);
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : s.length - dot - 1;
}

function clampRound(value: number, min: number, max: number, decimals: number): number {
  const clamped = Math.min(max, Math.max(min, value));
  const factor = 10 ** decimals;
  return Math.round(clamped * factor) / factor;
}

interface StepperFieldProps {
  id: string;
  label: string;
  unit?: string;
  value: number;
  constraints: NumberConstraints;
  onChange: (value: number) => void;
}

const STEP_BUTTON_CLASS =
  "flex w-7 shrink-0 items-center justify-center text-foreground-subtle transition-colors hover:bg-elevated hover:text-foreground active:bg-elevated disabled:pointer-events-none disabled:opacity-30";

function StepperField({ id, label, unit, value, constraints, onChange }: StepperFieldProps) {
  const min = constraints.min ?? 0;
  const max = constraints.max ?? Number.MAX_SAFE_INTEGER;
  const step = constraints.step ?? 1;
  const decimals = stepDecimals(step);

  const nudge = (direction: 1 | -1) => {
    const base = Number.isFinite(value) ? value : min;
    onChange(clampRound(base + direction * step, min, max, decimals));
  };

  return (
    <div className="py-1.5">
      <FieldLabel htmlFor={id} label={label} unit={unit} />
      <div className="flex h-7 items-stretch overflow-hidden rounded-md border border-border bg-background transition-colors focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/40 hover:border-border-strong">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          tabIndex={-1}
          disabled={value <= min}
          onClick={() => nudge(-1)}
          className={cn(STEP_BUTTON_CLASS, "border-r border-border")}
        >
          <Minus className="h-3 w-3" />
        </button>
        <input
          id={id}
          type="number"
          value={String(value)}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full min-w-0 flex-1 bg-transparent px-1 text-center font-mono text-xs text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          tabIndex={-1}
          disabled={value >= max}
          onClick={() => nudge(1)}
          className={cn(STEP_BUTTON_CLASS, "border-l border-border")}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ── Boolean toggle ─────────────────────────────────────────

interface ToggleFieldProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function ToggleField({ label, value, onChange }: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="truncate text-[11px] text-foreground-muted">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={`${label}: ${value ? "on" : "off"}`}
        onClick={() => onChange(!value)}
        className={cn(
          "h-5 w-9 shrink-0 rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          value ? "bg-primary hover:bg-primary-hover" : "bg-muted hover:bg-muted/80",
        )}
      >
        <div
          className={cn(
            "h-4 w-4 rounded-full bg-white shadow transition-transform",
            value ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

// ── Dispatcher ─────────────────────────────────────────────

export const ConfigField = memo(function ConfigField({
  configKey,
  value,
  type,
  options,
  numberConstraints,
  onChange,
}: ConfigFieldProps) {
  const id = useId();
  const { label, unit } = parseConfigKey(configKey);

  if (type === "boolean") {
    return <ToggleField label={label} value={Boolean(value)} onChange={onChange} />;
  }

  if (type === "select" && options) {
    // Preserve out-of-list values instead of silently dropping them.
    const allOptions = options.includes(String(value)) ? options : [String(value), ...options];
    return (
      <div className="py-1.5">
        <FieldLabel htmlFor={id} label={label} unit={unit} />
        <select
          id={id}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className={cn(INPUT_BASE, "cursor-pointer")}
        >
          {allOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Enhanced treatment for known numeric keys: − value + stepper.
  if (type === "number" && numberConstraints) {
    return (
      <StepperField
        id={id}
        label={label}
        unit={unit}
        value={typeof value === "number" ? value : Number(value)}
        constraints={numberConstraints}
        onChange={onChange}
      />
    );
  }

  // Plain input fallback for unknown keys (numbers and strings alike).
  return (
    <div className="py-1.5">
      <FieldLabel htmlFor={id} label={label} unit={unit} />
      <input
        id={id}
        type={type}
        value={String(value)}
        onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        className={cn(INPUT_BASE, type === "number" && "text-right font-mono")}
      />
    </div>
  );
});
