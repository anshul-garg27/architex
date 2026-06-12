"use client";

import { memo, useCallback, type ReactNode } from "react";
import { MousePointerClick, Activity } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";
import { cn } from "@/lib/utils";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type NodeCategory,
} from "@/lib/palette-items";
import { getNodeIcon } from "./properties-icon-registry";
import { ConfigField, type NumberConstraints, type ConfigFieldType } from "./properties-fields";
import { computeDerivedInsights, parseConfigKey } from "./properties-derived";

// ── Field policy ───────────────────────────────────────────

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

// ── Status chip ────────────────────────────────────────────

const STATE_CHIP_CLASSES: Record<string, string> = {
  idle: "border-state-idle/40 bg-state-idle/10 text-state-idle",
  active: "border-state-active/40 bg-state-active/10 text-state-active",
  success: "border-state-success/40 bg-state-success/10 text-state-success",
  warning: "border-state-warning/40 bg-state-warning/10 text-state-warning",
  error: "border-state-error/40 bg-state-error/10 text-state-error",
  processing: "border-state-processing/40 bg-state-processing/10 text-state-processing",
};

const STATE_DOT_CLASSES: Record<string, string> = {
  idle: "bg-state-idle",
  active: "bg-state-active",
  success: "bg-state-success",
  warning: "bg-state-warning",
  error: "bg-state-error",
  processing: "bg-state-processing",
};

function StatusChip({ state }: { state: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
        STATE_CHIP_CLASSES[state] ?? STATE_CHIP_CLASSES.idle,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          STATE_DOT_CLASSES[state] ?? STATE_DOT_CLASSES.idle,
          state !== "idle" && "animate-pulse",
        )}
      />
      {state}
    </span>
  );
}

// ── Section eyebrow ────────────────────────────────────────

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
      {children}
    </h3>
  );
}

// ── Main panel ─────────────────────────────────────────────

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
    const count = selectedNodeIds.length;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border-strong text-foreground-subtle">
          <MousePointerClick className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground-muted">
            {count > 1 ? `${count} components selected` : "Select a component"}
          </p>
          <p className="mx-auto mt-1 max-w-[190px] text-xs leading-relaxed text-foreground-subtle">
            {count > 1
              ? "Narrow to a single node to tune its configuration."
              : "Click any node on the canvas to tune its configuration and see what it implies."}
          </p>
        </div>
      </div>
    );
  }

  const data = selectedNode.data as Record<string, unknown> | undefined;
  const label = typeof data?.label === "string" ? data.label : "Untitled";
  const category = typeof data?.category === "string" ? data.category : "unknown";
  const componentType = typeof data?.componentType === "string" ? data.componentType : "unknown";
  const iconName = typeof data?.icon === "string" ? data.icon : "Box";
  const config: Record<string, string | number | boolean> =
    data?.config && typeof data.config === "object" && !Array.isArray(data.config)
      ? (data.config as Record<string, string | number | boolean>)
      : {};
  const metrics: Record<string, number> | undefined =
    data?.metrics && typeof data.metrics === "object" && !Array.isArray(data.metrics)
      ? (data.metrics as Record<string, number>)
      : undefined;
  const state = typeof data?.state === "string" ? data.state : "idle";

  const Icon = getNodeIcon(iconName);
  const categoryColor = CATEGORY_COLORS[category as NodeCategory] ?? "var(--foreground-muted)";
  const categoryLabel = CATEGORY_LABELS[category as NodeCategory] ?? category;

  const configEntries = Object.entries(config);
  const metricEntries = metrics ? Object.entries(metrics) : [];
  const insights = computeDerivedInsights(componentType, config);

  return (
    <div className="flex h-full flex-col">
      {/* ---- Identity header ---- */}
      <div className="border-b border-sidebar-border px-3 py-3">
        <div className="flex items-start gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
            style={{
              color: categoryColor,
              borderColor: `color-mix(in srgb, ${categoryColor} 35%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${categoryColor} 12%, transparent)`,
            }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{label}</p>
            <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
              {categoryLabel}
              <span className="mx-1 text-foreground-subtle/50">·</span>
              {componentType}
            </p>
          </div>
        </div>
        <div className="mt-2.5">
          <StatusChip state={state} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ---- Configuration ---- */}
        <section className="px-3 py-3">
          <div className="mb-1.5">
            <SectionEyebrow>Configuration</SectionEyebrow>
          </div>
          {configEntries.length === 0 ? (
            <p className="py-1 text-xs text-foreground-subtle">
              No tunable settings for this component.
            </p>
          ) : (
            configEntries.map(([key, value]) => {
              const fieldType: ConfigFieldType =
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
                  configKey={key}
                  value={value}
                  type={fieldType}
                  options={SELECT_FIELDS[key]}
                  numberConstraints={NUMBER_CONSTRAINTS[key]}
                  onChange={(v) => handleConfigChange(key, v)}
                />
              );
            })
          )}
        </section>

        {/* ---- Derived insights ---- */}
        {insights.length > 0 && (
          <>
            <div className="mx-3 border-t border-sidebar-border" />
            <section className="px-3 py-3">
              <div className="mb-2 flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-primary" />
                <SectionEyebrow>Derived</SectionEyebrow>
              </div>
              <div className="overflow-hidden rounded-lg border border-primary/20 bg-primary/5">
                {insights.map((insight, i) => (
                  <div
                    key={insight.label}
                    className={cn("px-2.5 py-2", i > 0 && "border-t border-primary/10")}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="shrink-0 text-[11px] text-foreground-muted">
                        {insight.label}
                      </span>
                      <span className="truncate font-mono text-xs font-medium text-foreground">
                        {insight.value}
                      </span>
                    </div>
                    {insight.formula && (
                      <p className="mt-0.5 truncate text-right font-mono text-[10px] text-foreground-subtle">
                        {insight.formula}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-foreground-subtle">
                Rough estimates from the current config (no queueing model) — directional, not a
                benchmark.
              </p>
            </section>
          </>
        )}

        {/* ---- Live metrics (shown during simulation) ---- */}
        {metricEntries.length > 0 && (
          <>
            <div className="mx-3 border-t border-sidebar-border" />
            <section className="px-3 py-3">
              <div className="mb-1.5">
                <SectionEyebrow>Live Metrics</SectionEyebrow>
              </div>
              {metricEntries.map(([key, value]) => (
                <div key={key} className="flex items-baseline justify-between gap-2 py-1">
                  <span className="text-[11px] text-foreground-muted">
                    {parseConfigKey(key).label}
                  </span>
                  <span className="font-mono text-xs text-foreground">
                    {typeof value === "number" ? value.toLocaleString() : value}
                  </span>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
});
