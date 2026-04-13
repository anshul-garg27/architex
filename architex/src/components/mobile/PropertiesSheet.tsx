"use client";

import { memo, useCallback } from "react";
import { Settings2 } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { cn } from "@/lib/utils";

// ── Config field select options (shared with PropertiesPanel) ──

const SELECT_FIELDS: Record<string, string[]> = {
  algorithm: ["round-robin", "least-connections", "ip-hash", "weighted", "consistent-hash"],
  type: ["postgresql", "mysql", "redis", "memcached", "kafka", "rabbitmq", "s3"],
  evictionPolicy: ["lru", "lfu", "ttl", "random"],
  consistencyLevel: ["ONE", "QUORUM", "ALL"],
  authType: ["jwt", "oauth2", "api-key", "basic"],
};

// ── Mobile config field — larger touch targets ────────────────

interface MobileConfigFieldProps {
  label: string;
  value: string | number | boolean;
  type: "text" | "number" | "select" | "boolean";
  options?: string[];
  onChange: (value: string | number | boolean) => void;
}

function MobileConfigField({ label, value, type, options, onChange }: MobileConfigFieldProps) {
  const displayLabel = label
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/Ms$/, " (ms)")
    .replace(/Rps$/, " (rps)")
    .replace(/Gb$/, " (GB)")
    .replace(/Tb$/, " (TB)")
    .replace(/Mb$/, " (MB)");

  if (type === "boolean") {
    return (
      <div className="flex items-center justify-between py-3">
        <span className="text-sm text-foreground-muted">{displayLabel}</span>
        <button
          aria-label={`${displayLabel}: ${value ? "on" : "off"}`}
          role="switch"
          aria-checked={!!value}
          onClick={() => onChange(!value)}
          className={cn(
            "h-7 w-12 rounded-full transition-colors",
            value ? "bg-primary" : "bg-muted",
          )}
        >
          <div
            className={cn(
              "h-6 w-6 rounded-full bg-white shadow transition-transform",
              value ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>
    );
  }

  if (type === "select" && options) {
    const selectId = `mobile-config-${label}`;
    return (
      <div className="flex flex-col gap-1.5 py-3">
        <label htmlFor={selectId} className="text-sm text-foreground-muted">{displayLabel}</label>
        <select
          id={selectId}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const inputId = `mobile-config-${label}`;
  return (
    <div className="flex flex-col gap-1.5 py-3">
      <label htmlFor={inputId} className="text-sm text-foreground-muted">{displayLabel}</label>
      <input
        id={inputId}
        type={type}
        value={String(value)}
        onChange={(e) =>
          onChange(type === "number" ? Number(e.target.value) : e.target.value)
        }
        className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

// ── PropertiesSheet ──────────────────────────────────────────

export interface PropertiesSheetProps {
  open: boolean;
  onClose: () => void;
}

export const PropertiesSheet = memo(function PropertiesSheet({
  open,
  onClose,
}: PropertiesSheetProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  const selectedNode =
    selectedNodeIds.length === 1
      ? nodes.find((n) => n.id === selectedNodeIds[0])
      : null;

  const handleConfigChange = useCallback(
    (key: string, value: string | number | boolean) => {
      if (!selectedNode) return;
      const currentConfig =
        ((selectedNode.data as Record<string, unknown>).config as Record<string, unknown>) ?? {};
      updateNodeData(selectedNode.id, {
        config: { ...currentConfig, [key]: value },
      });
    },
    [selectedNode, updateNodeData],
  );

  // ── Empty state ─────────────────────────────────────────
  if (!selectedNode) {
    return (
      <BottomSheet open={open} onClose={onClose} defaultSnap="half">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <Settings2 className="h-12 w-12 text-foreground-subtle" />
          <div>
            <p className="text-base font-medium text-foreground-muted">
              No node selected
            </p>
            <p className="mt-1 text-sm text-foreground-subtle">
              Tap a node on the canvas to see its properties
            </p>
          </div>
        </div>
      </BottomSheet>
    );
  }

  const { label, category, componentType, config, metrics, state } =
    selectedNode.data as {
      label: string;
      category: string;
      componentType: string;
      config: Record<string, string | number | boolean>;
      metrics?: Record<string, number>;
      state: string;
    };

  return (
    <BottomSheet open={open} onClose={onClose} defaultSnap="half">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="border-b border-border pb-4">
          <h2 className="text-lg font-semibold text-foreground">{label}</h2>
          <p className="mt-0.5 text-sm text-foreground-muted">
            {category} / {componentType}
          </p>
        </div>

        {/* State indicator */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-3 w-3 rounded-full",
              state === "idle" && "bg-state-idle",
              state === "active" && "bg-state-active",
              state === "success" && "bg-state-success",
              state === "warning" && "bg-state-warning",
              state === "error" && "bg-state-error",
              state === "processing" && "bg-state-processing",
            )}
          />
          <span className="text-sm capitalize text-foreground">{state}</span>
        </div>

        {/* Configuration */}
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Configuration
          </h3>
          <div className="divide-y divide-border">
            {Object.entries(config).map(([key, value]) => {
              const fieldType =
                typeof value === "boolean"
                  ? "boolean"
                  : typeof value === "number"
                    ? "number"
                    : SELECT_FIELDS[key]
                      ? "select"
                      : "text";

              return (
                <MobileConfigField
                  key={key}
                  label={key}
                  value={value}
                  type={fieldType as "text" | "number" | "select" | "boolean"}
                  options={SELECT_FIELDS[key]}
                  onChange={(v) => handleConfigChange(key, v)}
                />
              );
            })}
          </div>
        </div>

        {/* Live Metrics */}
        {metrics && Object.keys(metrics).length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Live Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(metrics).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-lg border border-border bg-muted/50 p-3"
                >
                  <span className="block text-xs text-foreground-muted">
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (s) => s.toUpperCase())}
                  </span>
                  <span className="mt-1 block font-mono text-sm font-semibold text-foreground">
                    {typeof value === "number" ? value.toLocaleString() : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spacer for bottom safe area */}
        <div className="h-4" />
      </div>
    </BottomSheet>
  );
});
