"use client";

import React, { memo } from "react";
import {
  Eye,
  EyeOff,
  ArrowRight,
  GitBranch,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MVCCState, MVCCStep, RowVersion, MVCCTransaction } from "@/lib/database/mvcc-viz";

// ── Version Card ────────────────────────────────────────────────

const VersionCard = memo(function VersionCard({
  version,
  isHighlightedRow,
  isVisible,
  highlightTxId,
}: {
  version: RowVersion;
  isHighlightedRow: boolean;
  isVisible: boolean;
  highlightTxId?: number;
}) {
  const isCreatedByHighlighted = highlightTxId != null && version.xmin === highlightTxId;
  const isDeletedByHighlighted = highlightTxId != null && version.xmax === highlightTxId;

  return (
    <div
      className={cn(
        "relative rounded-xl border p-3 transition-all",
        isHighlightedRow && isVisible
          ? "border-green-500/30 bg-green-500/5 backdrop-blur-sm shadow-[0_0_15px_rgba(34,197,94,0.05)] ring-1 ring-green-700/40"
          : isHighlightedRow && !isVisible
            ? "border-red-500/30 bg-red-500/5 opacity-50"
            : "border-border/30 bg-elevated/50 backdrop-blur-sm",
      )}
    >
      {/* Visibility indicator */}
      {isHighlightedRow && (
        <div className="absolute -right-1 -top-1">
          {isVisible ? (
            <div className="rounded-full bg-green-900 p-0.5">
              <Eye className="h-3 w-3 text-green-400" />
            </div>
          ) : (
            <div className="rounded-full bg-red-900 p-0.5">
              <EyeOff className="h-3 w-3 text-red-400" />
            </div>
          )}
        </div>
      )}

      {/* Value */}
      <div className="mb-2 text-center">
        <span
          className={cn(
            "inline-block rounded-xl px-3 py-1 font-mono text-sm font-bold",
            isVisible && isHighlightedRow
              ? "bg-green-500/10 text-green-300"
              : !isVisible && isHighlightedRow
                ? "bg-red-500/10 text-red-400 line-through"
                : "bg-background text-foreground",
          )}
        >
          &quot;{version.value}&quot;
        </span>
      </div>

      {/* xmin / xmax */}
      <div className="flex items-center justify-between gap-2 text-[10px]">
        <div className={cn("flex items-center gap-1", isCreatedByHighlighted ? "font-bold text-blue-400" : "text-foreground-muted")}>
          <span className="font-semibold">xmin:</span>
          <span className="font-mono">
            {version.xmin === 0 ? "sys" : `T${version.xmin}`}
          </span>
        </div>
        <div className={cn("flex items-center gap-1", isDeletedByHighlighted ? "font-bold text-red-400" : "text-foreground-muted")}>
          <span className="font-semibold">xmax:</span>
          <span className="font-mono">
            {version.xmax === null ? (
              <span className="text-green-500">null</span>
            ) : (
              <span className="text-red-400">T{version.xmax}</span>
            )}
          </span>
        </div>
      </div>

      {/* Row ID */}
      <div className="mt-1 text-center text-[10px] text-foreground-subtle">
        Row {version.rowId} | Version {version.id}
      </div>
    </div>
  );
});

// ── Transaction Badge ───────────────────────────────────────────

const TransactionBadge = memo(function TransactionBadge({
  tx,
  isHighlighted,
}: {
  tx: MVCCTransaction;
  isHighlighted: boolean;
}) {
  const statusColor =
    tx.status === "active"
      ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
      : tx.status === "committed"
        ? "bg-green-500/10 border-green-500/30 text-green-400"
        : "bg-red-500/10 border-red-500/30 text-red-400";

  const StatusIcon =
    tx.status === "committed"
      ? CheckCircle2
      : tx.status === "aborted"
        ? XCircle
        : Clock;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2 transition-all",
        statusColor,
        isHighlighted && "ring-2 ring-primary/50",
      )}
    >
      <StatusIcon className="h-4 w-4" />
      <div>
        <span className="block text-xs font-bold">T{tx.txId}</span>
        <span className="block text-[10px]">
          Snapshot @ t={tx.startTime} | {tx.status}
        </span>
      </div>
    </div>
  );
});

// ── Version Chain ───────────────────────────────────────────────

const VersionChain = memo(function VersionChain({
  versions,
  rowId,
  highlightTxId,
  visibleVersionIds,
}: {
  versions: RowVersion[];
  rowId: number;
  highlightTxId?: number;
  visibleVersionIds?: string[];
}) {
  const rowVersions = versions
    .filter((v) => v.rowId === rowId)
    .sort((a, b) => a.xmin - b.xmin);

  if (rowVersions.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/30 bg-background/50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-foreground-subtle" />
        <span className="text-xs font-semibold text-foreground-muted">
          Row {rowId} Version Chain
        </span>
        <span className="ml-auto text-[10px] text-foreground-subtle">
          {rowVersions.length} version{rowVersions.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {rowVersions.map((v, i) => (
          <React.Fragment key={v.id}>
            {i > 0 && (
              <ArrowRight className="h-4 w-4 shrink-0 text-foreground-subtle" />
            )}
            <div className="shrink-0">
              <VersionCard
                version={v}
                isHighlightedRow={highlightTxId != null}
                isVisible={visibleVersionIds?.includes(v.id) ?? false}
                highlightTxId={highlightTxId}
              />
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
});

// ── Main Canvas ─────────────────────────────────────────────────

const MVCCCanvas = memo(function MVCCCanvas({
  steps,
  stepIndex,
  onRunDemo,
}: {
  steps: MVCCStep[];
  stepIndex: number;
  onRunDemo: () => void;
}) {
  const currentStep = steps[stepIndex] ?? null;
  const state = currentStep?.state ?? null;

  // Empty state
  if (!state || steps.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-elevated/80 to-background p-6">
        <Layers className="mb-4 h-16 w-16 text-foreground-subtle opacity-30" />
        <h3 className="mb-2 text-lg font-bold text-foreground-muted">
          MVCC Visualization
        </h3>
        <p className="mb-4 max-w-md text-center text-sm text-foreground-subtle">
          Multi-Version Concurrency Control keeps multiple versions of each row.
          Each transaction sees a consistent snapshot — as if the database was
          frozen at the moment it began.
        </p>
        <button
          onClick={onRunDemo}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)]"
        >
          Run Snapshot Isolation Demo
        </button>
      </div>
    );
  }

  // Get unique row IDs
  const rowIds = [...new Set(state.rows.map((v) => v.rowId))].sort();

  // Operation color
  const operationColor: Record<string, string> = {
    begin: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    read: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    write: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    commit: "bg-green-500/10 border-green-500/30 text-green-400",
    abort: "bg-red-500/10 border-red-500/30 text-red-400",
    snapshot: "bg-violet-500/10 border-violet-500/30 text-violet-400",
  };

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-gradient-to-b from-elevated/80 to-background p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Layers className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-bold text-foreground">
            MVCC — Multi-Version Concurrency Control
          </h3>
          <p className="text-xs text-foreground-muted">
            PostgreSQL-style snapshot isolation in action
          </p>
        </div>
        <span className="ml-auto rounded-full bg-primary/15 px-3 py-0.5 font-mono text-xs font-semibold text-primary">
          Global Time: {state.globalTime}
        </span>
      </div>

      {/* Current step description */}
      {currentStep && (
        <div
          className={cn(
            "mb-4 rounded-xl border p-4 transition-all",
            operationColor[currentStep.operation] ?? "border-border/30 bg-elevated/50 backdrop-blur-sm",
          )}
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-background/50 px-2 py-0.5 text-[10px] font-bold uppercase">
              {currentStep.operation}
            </span>
            {currentStep.highlightTxId != null && (
              <span className="text-[10px] font-semibold">
                T{currentStep.highlightTxId}
              </span>
            )}
            <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
              Step {stepIndex + 1}/{steps.length}
            </span>
          </div>
          <p className="text-xs text-foreground">{currentStep.description}</p>
        </div>
      )}

      {/* Transactions row */}
      <div className="mb-4">
        <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Active Transactions
        </h4>
        <div className="flex flex-wrap gap-2">
          {state.transactions.map((tx) => (
            <TransactionBadge
              key={tx.txId}
              tx={tx}
              isHighlighted={currentStep?.highlightTxId === tx.txId}
            />
          ))}
          {state.transactions.length === 0 && (
            <span className="text-xs text-foreground-subtle">
              No transactions yet
            </span>
          )}
        </div>
      </div>

      {/* Version chains */}
      <div className="flex-1 space-y-3">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Row Versions (Version Chain)
        </h4>
        {rowIds.map((rowId) => (
          <VersionChain
            key={rowId}
            versions={state.rows}
            rowId={rowId}
            highlightTxId={currentStep?.highlightTxId}
            visibleVersionIds={currentStep?.visibleVersionIds}
          />
        ))}
        {rowIds.length === 0 && (
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-4 text-center text-xs text-foreground-subtle">
            No rows yet
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border/30 pt-3 text-[10px] text-foreground-subtle">
        <div className="flex items-center gap-1">
          <Eye className="h-3 w-3 text-green-400" />
          <span>Visible to current transaction</span>
        </div>
        <div className="flex items-center gap-1">
          <EyeOff className="h-3 w-3 text-red-400" />
          <span>Invisible (created after snapshot or uncommitted)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-bold text-blue-400">xmin</span>
          <span>= Creating transaction</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-bold text-red-400">xmax</span>
          <span>= Deleting/superseding transaction (null = alive)</span>
        </div>
      </div>
    </div>
  );
});

export default MVCCCanvas;
