"use client";

import { memo, useCallback } from "react";
import { X, Settings2 } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";
import { cn } from "@/lib/utils";

interface NumberConstraints {
  min?: number;
  max?: number;
  step?: number;
}

interface ConfigFieldProps {
  label: string;
  value: string | number | boolean;
  type: "text" | "number" | "select" | "boolean";
  options?: string[];
  numberConstraints?: NumberConstraints;
  onChange: (value: string | number | boolean) => void;
}

function ConfigField({ label, value, type, options, numberConstraints, onChange }: ConfigFieldProps) {
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
      <div className="flex items-center justify-between py-1.5">
        <span className="text-xs text-foreground-muted">{displayLabel}</span>
        <button
          aria-label={`${displayLabel}: ${value ? "on" : "off"}`}
          role="switch"
          aria-checked={!!value}
          onClick={() => onChange(!value)}
          className={cn(
            "h-5 w-9 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            value ? "bg-primary" : "bg-muted",
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

  if (type === "select" && options) {
    const selectId = `config-${label}`;
    return (
      <div className="flex flex-col gap-1 py-1.5">
        <label htmlFor={selectId} className="text-xs text-foreground-muted">{displayLabel}</label>
        <select
          id={selectId}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

  const inputId = `config-${label}`;
  return (
    <div className="flex flex-col gap-1 py-1.5">
      <label htmlFor={inputId} className="text-xs text-foreground-muted">{displayLabel}</label>
      <input
        id={inputId}
        type={type}
        value={String(value)}
        onChange={(e) =>
          onChange(type === "number" ? Number(e.target.value) : e.target.value)
        }
        {...(type === "number" && numberConstraints
          ? {
              min: numberConstraints.min,
              max: numberConstraints.max,
              step: numberConstraints.step,
            }
          : {})}
        className="h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

const NUMBER_CONSTRAINTS: Record<string, NumberConstraints> = {
  // Replicas / instances / counts
  replicas: { min: 1, max: 100, step: 1 },
  instances: { min: 1, max: 100, step: 1 },
  partitions: { min: 1, max: 1000, step: 1 },
  replicationFactor: { min: 1, max: 10, step: 1 },
  edgeLocations: { min: 1, max: 500, step: 1 },
  replication: { min: 1, max: 10, step: 1 },
  // Latency / time (ms)
  processingTimeMs: { min: 0, max: 10000, step: 10 },
  timeoutMs: { min: 0, max: 10000, step: 10 },
  healthCheckInterval: { min: 1, max: 600, step: 1 },
  ttlSeconds: { min: 0, max: 604800, step: 60 },
  retentionHours: { min: 1, max: 8760, step: 1 },
  // Throughput (rps / connections)
  rateLimitRps: { min: 0, max: 1000000, step: 100 },
  maxConnections: { min: 1, max: 1000000, step: 100 },
  // Error rate (%)
  cacheHitRate: { min: 0, max: 1, step: 0.01 },
  // Storage / memory
  storageGB: { min: 1, max: 100000, step: 1 },
  storageTB: { min: 0, max: 10000, step: 0.1 },
  memoryGB: { min: 0.5, max: 1024, step: 0.5 },
};

const SELECT_FIELDS: Record<string, string[]> = {
  algorithm: ["round-robin", "least-connections", "ip-hash", "weighted", "consistent-hash"],
  type: ["postgresql", "mysql", "redis", "memcached", "kafka", "rabbitmq", "s3"],
  evictionPolicy: ["lru", "lfu", "ttl", "random"],
  consistencyLevel: ["ONE", "QUORUM", "ALL"],
  authType: ["jwt", "oauth2", "api-key", "basic"],
};

export const PropertiesPanel = memo(function PropertiesPanel() {
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  const selectedNode = selectedNodeIds.length === 1
    ? nodes.find((n) => n.id === selectedNodeIds[0])
    : null;

  const handleConfigChange = useCallback(
    (key: string, value: string | number | boolean) => {
      if (!selectedNode) return;
      const data = selectedNode.data as Record<string, unknown> | undefined;
      const currentConfig =
        data && typeof data.config === "object" && data.config !== null
          ? (data.config as Record<string, unknown>)
          : {};
      updateNodeData(selectedNode.id, {
        config: { ...currentConfig, [key]: value },
      });
    },
    [selectedNode, updateNodeData],
  );

  if (!selectedNode) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
        <Settings2 className="h-10 w-10 text-foreground-subtle" />
        <div>
          <p className="text-sm font-medium text-foreground-muted">
            No node selected
          </p>
          <p className="mt-1 text-xs text-foreground-subtle">
            Click a node on the canvas to see its properties
          </p>
        </div>
      </div>
    );
  }

  const data = selectedNode.data as Record<string, unknown> | undefined;
  const label = typeof data?.label === "string" ? data.label : "Untitled";
  const category = typeof data?.category === "string" ? data.category : "unknown";
  const componentType = typeof data?.componentType === "string" ? data.componentType : "unknown";
  const config: Record<string, string | number | boolean> =
    data?.config && typeof data.config === "object" && !Array.isArray(data.config)
      ? (data.config as Record<string, string | number | boolean>)
      : {};
  const metrics: Record<string, number> | undefined =
    data?.metrics && typeof data.metrics === "object" && !Array.isArray(data.metrics)
      ? (data.metrics as Record<string, number>)
      : undefined;
  const state = typeof data?.state === "string" ? data.state : "idle";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Properties
        </h2>
        <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-foreground-muted">
          {category} / {componentType}
        </p>
      </div>

      {/* Config */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Configuration
          </h3>
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
              <ConfigField
                key={key}
                label={key}
                value={value}
                type={fieldType as "text" | "number" | "select" | "boolean"}
                options={SELECT_FIELDS[key]}
                numberConstraints={NUMBER_CONSTRAINTS[key]}
                onChange={(v) => handleConfigChange(key, v)}
              />
            );
          })}
        </div>

        {/* Metrics (shown during simulation) */}
        {metrics && Object.keys(metrics).length > 0 && (
          <div className="mb-3">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Live Metrics
            </h3>
            {Object.entries(metrics).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between py-1"
              >
                <span className="text-xs text-foreground-muted">
                  {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                </span>
                <span className="text-xs font-mono text-foreground">
                  {typeof value === "number" ? value.toLocaleString() : value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* State */}
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            State
          </h3>
          <div className="flex items-center gap-2 py-1">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                state === "idle" && "bg-state-idle",
                state === "active" && "bg-state-active",
                state === "success" && "bg-state-success",
                state === "warning" && "bg-state-warning",
                state === "error" && "bg-state-error",
                state === "processing" && "bg-state-processing",
              )}
            />
            <span className="text-xs capitalize text-foreground">{state}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
