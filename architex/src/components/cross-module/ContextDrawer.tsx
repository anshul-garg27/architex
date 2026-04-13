"use client";

// ─────────────────────────────────────────────────────────────
// Architex — Context Drawer Component (CROSS-004)
// Slide-in drawer showing bridge educational context.
// ─────────────────────────────────────────────────────────────

import React, { memo, useCallback, useEffect, useRef } from "react";
import {
  X,
  ArrowLeft,
  Play,
  ArrowRight,
  Zap,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BridgePayload, CrossModuleContext } from "@/lib/cross-module/bridge-types";
import { MODULE_LABELS, MODULE_COLORS } from "@/lib/cross-module/bridge-types";
import type { BridgeHandlerResult } from "@/lib/cross-module/bridge-handlers";

// ── Payload type labels ───────────────────────────────────────

const BRIDGE_TYPE_LABELS: Record<BridgePayload["type"], string> = {
  "algorithm-to-system": "Algorithm Impact",
  "data-structure-to-system": "Data Structure Configuration",
  "database-to-system": "Database Schema Deployment",
  "distributed-to-system": "Distributed System Configuration",
  "networking-to-system": "Network Protocol Setup",
  "concurrency-to-system": "Concurrency Model",
  "lld-to-system": "Design Pattern Scaffold",
  "security-to-system": "Security Configuration",
  "interview-simulate": "Interview Simulation Scoring",
  "knowledge-graph-open-concept": "Concept Navigation",
};

// ── Props ─────────────────────────────────────────────────────

interface ContextDrawerProps {
  bridge: BridgePayload;
  result: BridgeHandlerResult;
  context: CrossModuleContext | null;
  onSimulate: () => void;
  onGoBack: () => void;
  onClose: () => void;
}

export const ContextDrawer = memo(function ContextDrawer({
  bridge,
  result,
  context,
  onSimulate,
  onGoBack,
  onClose,
}: ContextDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleSimulateClick = useCallback(() => {
    onSimulate();
  }, [onSimulate]);

  const sourceColor = context ? MODULE_COLORS[context.sourceModule] : "#6366F1";
  const targetColor = context ? MODULE_COLORS[context.targetModule] : "#3B82F6";
  const sourceLabel = context ? MODULE_LABELS[context.sourceModule] : "Source";
  const targetLabel = context ? MODULE_LABELS[context.targetModule] : "Target";

  const configEntries = Object.entries(result.details.configOverrides as Record<string, unknown> ?? {});

  return (
    <div
      ref={drawerRef}
      className={cn(
        "fixed right-0 top-0 z-50 flex h-full w-80 flex-col",
        "border-l border-[var(--border-primary)] bg-[var(--bg-primary)]",
        "shadow-xl",
        "animate-in slide-in-from-right duration-200",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[var(--text-accent)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Bridge Context
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Bridge type badge */}
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
            Bridge Type
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
            {BRIDGE_TYPE_LABELS[bridge.type]}
          </p>
        </div>

        {/* Navigation path */}
        {context && (
          <div className="flex items-center gap-2 text-xs">
            <span
              className="rounded-full px-2 py-0.5 font-medium"
              style={{ backgroundColor: `${sourceColor}20`, color: sourceColor }}
            >
              {sourceLabel}
            </span>
            <ArrowRight className="h-3 w-3 text-[var(--text-tertiary)]" />
            <span
              className="rounded-full px-2 py-0.5 font-medium"
              style={{ backgroundColor: `${targetColor}20`, color: targetColor }}
            >
              {targetLabel}
            </span>
          </div>
        )}

        {/* Action description */}
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
            <Info className="h-3 w-3" />
            <span>Action</span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-primary)]">
            {result.action.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </p>
        </div>

        {/* Configuration overrides */}
        {configEntries.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Configuration
            </p>
            <div className="space-y-1">
              {configEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-md bg-[var(--bg-secondary)] px-2.5 py-1.5 text-xs"
                >
                  <span className="text-[var(--text-secondary)]">
                    {key.replace(/-/g, " ")}
                  </span>
                  <span className="font-mono text-[var(--text-primary)]">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Breadcrumb trail */}
        {context && context.breadcrumb.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Navigation Trail
            </p>
            <div className="flex flex-wrap items-center gap-1 text-xs">
              {context.breadcrumb.map((crumb, i) => (
                <React.Fragment key={`${crumb.module}-${i}`}>
                  {i > 0 && (
                    <ArrowRight className="h-3 w-3 text-[var(--text-tertiary)]" />
                  )}
                  <span className="rounded-md bg-[var(--bg-secondary)] px-1.5 py-0.5 text-[var(--text-secondary)]">
                    {crumb.label}
                  </span>
                </React.Fragment>
              ))}
              <ArrowRight className="h-3 w-3 text-[var(--text-tertiary)]" />
              <span className="rounded-md bg-[var(--bg-tertiary)] px-1.5 py-0.5 font-medium text-[var(--text-primary)]">
                {targetLabel}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 border-t border-[var(--border-primary)] px-4 py-3">
        <button
          type="button"
          onClick={onGoBack}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium",
            "border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
            "hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
            "transition-colors",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
        <button
          type="button"
          onClick={handleSimulateClick}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium",
            "bg-[var(--bg-accent)] text-white",
            "hover:opacity-90",
            "transition-opacity",
          )}
        >
          <Play className="h-4 w-4" />
          Run Simulation
        </button>
      </div>
    </div>
  );
});
