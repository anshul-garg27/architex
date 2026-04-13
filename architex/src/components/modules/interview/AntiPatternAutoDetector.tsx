"use client";

import React, { memo } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────

export interface AntiPattern {
  id: string;
  severity: "error" | "warning" | "info";
  title: string;
  description: string;
}

interface AntiPatternAutoDetectorProps {
  /** Whether a challenge is actively being designed */
  isDesigning: boolean;
  /** Detected anti-patterns to display */
  patterns?: AntiPattern[];
  className?: string;
}

// ── Constants ──────────────────────────────────────────────

const SEVERITY_ICON = {
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
} as const;

const SEVERITY_COLORS = {
  error: "text-red-400 bg-red-500/10 border-red-500/20",
  warning: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
} as const;

const PLACEHOLDER_PATTERNS: AntiPattern[] = [
  {
    id: "spof",
    severity: "error",
    title: "Single Point of Failure",
    description:
      "Your design has a single database without replication. Consider adding read replicas or a failover setup.",
  },
  {
    id: "no-cache",
    severity: "warning",
    title: "No Caching Layer",
    description:
      "No cache detected between the API and database. Adding a cache (e.g., Redis) can reduce latency.",
  },
  {
    id: "no-lb",
    severity: "info",
    title: "Consider Load Balancing",
    description:
      "Multiple servers detected without a load balancer. Adding one improves availability.",
  },
];

// ── Component ──────────────────────────────────────────────

function AntiPatternAutoDetectorInner({
  isDesigning,
  patterns,
  className,
}: AntiPatternAutoDetectorProps) {
  const detected = patterns ?? (isDesigning ? PLACEHOLDER_PATTERNS : []);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <AlertTriangle className="h-3.5 w-3.5 text-foreground-muted" />
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Anti-Pattern Detector
        </span>
        {detected.length > 0 && (
          <span className="ml-auto rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
            {detected.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {!isDesigning ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="mb-2 h-6 w-6 text-foreground-subtle opacity-30" />
            <p className="text-xs text-foreground-muted">
              Start designing a challenge to enable anti-pattern detection.
            </p>
          </div>
        ) : detected.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="mb-2 h-6 w-6 text-emerald-400 opacity-60" />
            <p className="text-xs text-emerald-400">
              No anti-patterns detected. Looking good!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {detected.map((p) => {
              const Icon = SEVERITY_ICON[p.severity];
              return (
                <div
                  key={p.id}
                  className={cn(
                    "rounded-md border px-3 py-2",
                    SEVERITY_COLORS[p.severity],
                  )}
                >
                  <div className="mb-0.5 flex items-center gap-1.5">
                    <Icon className="h-3 w-3 shrink-0" />
                    <span className="text-xs font-medium">{p.title}</span>
                  </div>
                  <p className="text-[11px] opacity-80">{p.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const AntiPatternAutoDetector = memo(AntiPatternAutoDetectorInner);
export default AntiPatternAutoDetector;
