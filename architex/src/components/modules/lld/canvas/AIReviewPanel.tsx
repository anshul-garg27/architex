"use client";

/**
 * AI Review Panel — floating overlay that shows AI-powered UML analysis.
 * Calls POST /api/ai/explain with the current canvas classes & relationships.
 */

import React, { memo, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  X,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UMLClass, UMLRelationship } from "@/lib/lld";

// ── Types ────────────────────────────────────────────────

interface DetectedPattern {
  name: string;
  confidence: number;
  evidence: string;
}

interface CorrectnessIssue {
  severity: "error" | "warning" | "info";
  message: string;
}

interface ExplainResponse {
  patterns: DetectedPattern[];
  correctness: CorrectnessIssue[];
  suggestions: string[];
  summary: string;
  isAI?: boolean;
}

// ── Fetch helper ─────────────────────────────────────────

async function fetchExplain(
  classes: UMLClass[],
  relationships: UMLRelationship[],
): Promise<ExplainResponse> {
  const res = await fetch("/api/ai/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ classes, relationships }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `Request failed: ${res.status}`,
    );
  }
  return res.json();
}

// ── Confidence badge ─────────────────────────────────────

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.75
      ? "text-green-400 border-green-500/30 bg-green-500/10"
      : value >= 0.5
        ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
        : "text-foreground-subtle border-border/30 bg-elevated/50";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium backdrop-blur-sm",
        color,
      )}
    >
      {pct}%
    </span>
  );
}

// ── Severity icon ────────────────────────────────────────

function SeverityIcon({ severity }: { severity: CorrectnessIssue["severity"] }) {
  switch (severity) {
    case "error":
      return <AlertCircle className="h-3 w-3 shrink-0 text-red-400" />;
    case "warning":
      return <AlertTriangle className="h-3 w-3 shrink-0 text-yellow-400" />;
    case "info":
      return <Info className="h-3 w-3 shrink-0 text-blue-400" />;
  }
}

// ── Skeleton ─────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-foreground/10",
        className,
      )}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
      </div>
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────

interface AIReviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  classes: UMLClass[];
  relationships: UMLRelationship[];
}

export const AIReviewPanel = memo(function AIReviewPanel({
  isOpen,
  onClose,
  classes,
  relationships,
}: AIReviewPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: () => fetchExplain(classes, relationships),
  });

  // Trigger analysis when panel opens
  useEffect(() => {
    if (isOpen && !mutation.data && !mutation.isPending) {
      mutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, onClose]);

  const handleRetry = useCallback(() => {
    mutation.mutate();
  }, [mutation]);

  if (!isOpen) return null;

  const data = mutation.data;

  return (
    <div
      ref={panelRef}
      className="absolute right-3 top-3 z-20 w-80 max-h-[70vh] overflow-y-auto rounded-2xl border border-border/30 bg-background/80 backdrop-blur-xl shadow-2xl"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/30 bg-background/90 backdrop-blur-md px-4 py-2.5">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          AI Review
        </span>
        {data?.isAI === false && (
          <span className="ml-auto mr-1 rounded-full border border-border/30 bg-elevated/50 px-1.5 py-0.5 text-[9px] text-foreground-subtle">
            heuristic
          </span>
        )}
        <button
          onClick={onClose}
          className="ml-auto flex h-5 w-5 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Close AI review"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Loading */}
      {mutation.isPending && <LoadingSkeleton />}

      {/* Error */}
      {mutation.isError && (
        <div className="p-4 space-y-2">
          <div className="flex items-start gap-1.5 rounded-xl border border-red-500/30 bg-red-500/5 px-2 py-2">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
            <span className="text-[11px] text-red-400">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Analysis failed"}
            </span>
          </div>
          <button
            onClick={handleRetry}
            className="w-full rounded-xl border border-border/30 bg-elevated/50 px-3 py-1.5 text-[11px] font-medium text-foreground-subtle transition-colors hover:bg-elevated hover:text-foreground"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="space-y-3 p-4">
          {/* Summary */}
          <p className="text-[11px] leading-relaxed text-foreground-muted">
            {data.summary}
          </p>

          {/* Patterns */}
          {data.patterns.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
                Patterns Detected
              </h3>
              {data.patterns.map((p, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2.5 py-2 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 shrink-0 text-green-400" />
                    <span className="text-[11px] font-medium text-foreground">
                      {p.name}
                    </span>
                    <ConfidenceBadge value={p.confidence} />
                  </div>
                  <p className="text-[10px] leading-relaxed text-foreground-subtle pl-5">
                    {p.evidence}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Correctness issues */}
          {data.correctness.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
                Issues
              </h3>
              {data.correctness.map((issue, i) => (
                <div
                  key={i}
                  className="flex items-start gap-1.5 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2.5 py-2"
                >
                  <SeverityIcon severity={issue.severity} />
                  <span className="text-[10px] leading-relaxed text-foreground-muted">
                    {issue.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {data.suggestions.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
                Suggestions
              </h3>
              <ul className="space-y-1 pl-1">
                {data.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-[10px] leading-relaxed text-foreground-muted"
                  >
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
