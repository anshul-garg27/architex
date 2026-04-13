"use client";

import React, { memo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  HardDrive,
  Play,
  RefreshCw,
  Search,
  Shield,
  XCircle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ARIESState,
  ARIESStep,
  WALEntry,
  DirtyPageEntry,
  TransactionTableEntry,
  DiskPage,
  RecoveryPhase,
} from "@/lib/database/aries-viz";

// ── Phase Badge ─────────────────────────────────────────────────

const PHASE_STYLES: Record<RecoveryPhase, { bg: string; label: string; icon: React.ElementType }> = {
  normal: { bg: "bg-blue-500/10 border-blue-500/30 text-blue-400", label: "NORMAL OPS", icon: Database },
  crash: { bg: "bg-red-500/10 border-red-500/30 text-red-400", label: "CRASH!", icon: Zap },
  analysis: { bg: "bg-violet-500/10 border-violet-500/30 text-violet-400", label: "PHASE 1: ANALYSIS", icon: Search },
  redo: { bg: "bg-amber-500/10 border-amber-500/30 text-amber-400", label: "PHASE 2: REDO", icon: RefreshCw },
  undo: { bg: "bg-rose-500/10 border-rose-500/30 text-rose-400", label: "PHASE 3: UNDO", icon: XCircle },
  complete: { bg: "bg-green-500/10 border-green-500/30 text-green-400", label: "RECOVERY COMPLETE", icon: CheckCircle2 },
};

// ── WAL Entry Row ───────────────────────────────────────────────

const WALEntryRow = memo(function WALEntryRow({
  entry,
  isHighlighted,
  isCheckpoint,
}: {
  entry: WALEntry;
  isHighlighted: boolean;
  isCheckpoint: boolean;
}) {
  const typeColors: Record<string, string> = {
    UPDATE: "text-amber-400 bg-amber-500/10",
    COMMIT: "text-green-400 bg-green-500/10",
    BEGIN: "text-blue-400 bg-blue-500/10",
    CHECKPOINT: "text-violet-400 bg-violet-500/10",
    CLR: "text-rose-400 bg-rose-500/10",
    ABORT: "text-red-400 bg-red-500/10",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-2.5 py-1.5 font-mono text-[11px] transition-all",
        isHighlighted
          ? "border-primary bg-primary/10 ring-1 ring-primary/40"
          : isCheckpoint
            ? "border-violet-500/30/50 bg-violet-500/5"
            : "border-border/30 bg-elevated/50 backdrop-blur-sm",
      )}
    >
      <span className="w-10 shrink-0 text-right font-bold text-foreground-muted">
        {entry.lsn}
      </span>
      <span className="w-8 shrink-0 text-foreground-subtle">{entry.txId}</span>
      <span
        className={cn(
          "shrink-0 rounded-xl px-1.5 py-0.5 text-[10px] font-bold",
          typeColors[entry.type] ?? "text-foreground-muted bg-background",
        )}
      >
        {entry.type}
      </span>
      {entry.pageId && (
        <span className="text-foreground-muted">{entry.pageId}</span>
      )}
      {entry.undoNextLSN != null && (
        <span className="text-[10px] text-rose-400/70">
          undo→{entry.undoNextLSN}
        </span>
      )}
    </div>
  );
});

// ── Dirty Page Table ────────────────────────────────────────────

const DirtyPageTable = memo(function DirtyPageTable({
  entries,
  highlightPage,
}: {
  entries: DirtyPageEntry[];
  highlightPage?: string;
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-background/50 p-3">
      <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
        <FileText className="h-3.5 w-3.5" />
        Dirty Page Table
      </h4>
      {entries.length === 0 ? (
        <p className="text-[10px] italic text-foreground-subtle">(empty)</p>
      ) : (
        <div className="space-y-1">
          <div className="flex gap-2 text-[9px] font-bold uppercase text-foreground-subtle">
            <span className="w-12">Page</span>
            <span>recLSN</span>
          </div>
          {entries.map((e) => (
            <div
              key={e.pageId}
              className={cn(
                "flex gap-2 rounded-xl px-1.5 py-0.5 font-mono text-[11px] transition-all",
                highlightPage === e.pageId
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-foreground-muted",
              )}
            >
              <span className="w-12">{e.pageId}</span>
              <span>{e.recLSN}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// ── Transaction Table ───────────────────────────────────────────

const TransactionTable = memo(function TransactionTable({
  entries,
  highlightTx,
}: {
  entries: TransactionTableEntry[];
  highlightTx?: string;
}) {
  const statusColor: Record<string, string> = {
    active: "text-blue-400",
    committed: "text-green-400",
    aborted: "text-red-400",
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "committed") return <CheckCircle2 className="h-3 w-3 text-green-400" />;
    if (status === "aborted") return <XCircle className="h-3 w-3 text-red-400" />;
    return <Clock className="h-3 w-3 text-blue-400" />;
  };

  return (
    <div className="rounded-xl border border-border/30 bg-background/50 p-3">
      <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
        <Database className="h-3.5 w-3.5" />
        Transaction Table
      </h4>
      {entries.length === 0 ? (
        <p className="text-[10px] italic text-foreground-subtle">(empty — lost in crash)</p>
      ) : (
        <div className="space-y-1">
          <div className="flex gap-2 text-[9px] font-bold uppercase text-foreground-subtle">
            <span className="w-8">TX</span>
            <span className="w-16">Status</span>
            <span>lastLSN</span>
          </div>
          {entries.map((e) => (
            <div
              key={e.txId}
              className={cn(
                "flex items-center gap-2 rounded-xl px-1.5 py-0.5 font-mono text-[11px] transition-all",
                highlightTx === e.txId
                  ? "bg-primary/10 font-bold"
                  : "",
              )}
            >
              <span className="w-8 font-bold text-foreground-muted">{e.txId}</span>
              <span className={cn("flex w-16 items-center gap-1", statusColor[e.status])}>
                <StatusIcon status={e.status} />
                {e.status}
              </span>
              <span className="text-foreground-subtle">{e.lastLSN}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// ── Disk Pages ──────────────────────────────────────────────────

const DiskPageCard = memo(function DiskPageCard({
  page,
  isHighlighted,
}: {
  page: DiskPage;
  isHighlighted: boolean;
}) {
  const isEmpty = page.value === "(empty)" || page.value === "(unknown)";
  const isUnknown = page.value === "(unknown)";

  return (
    <div
      className={cn(
        "relative rounded-xl border p-3 text-center transition-all",
        isHighlighted
          ? "border-primary bg-primary/10 ring-1 ring-primary/40"
          : isUnknown
            ? "border-red-500/30/50 bg-red-500/5"
            : isEmpty
              ? "border-border/30 bg-elevated/50 backdrop-blur-sm"
              : "border-green-500/30/50 bg-green-500/5",
      )}
    >
      <div className="mb-1 text-xs font-bold text-foreground-muted">{page.pageId}</div>
      <div
        className={cn(
          "rounded-xl px-2 py-1 font-mono text-[11px]",
          isUnknown
            ? "bg-red-500/10 text-red-400"
            : isEmpty
              ? "bg-background text-foreground-subtle"
              : "bg-green-500/10 text-green-300",
        )}
      >
        {page.value}
      </div>
      {page.flushedToLSN > 0 && (
        <div className="mt-1 text-[9px] text-foreground-subtle">
          flushed@{page.flushedToLSN}
        </div>
      )}
    </div>
  );
});

// ── Main Canvas ─────────────────────────────────────────────────

const ARIESCanvas = memo(function ARIESCanvas({
  steps,
  stepIndex,
  onRunDemo,
}: {
  steps: ARIESStep[];
  stepIndex: number;
  onRunDemo: () => void;
}) {
  const currentStep = steps[stepIndex] ?? null;
  const state = currentStep?.state ?? null;

  // Empty state — show intro
  if (!state || steps.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-elevated/80 to-background p-6">
        <Shield className="mb-4 h-16 w-16 text-foreground-subtle opacity-30" />
        <h3 className="mb-2 text-lg font-bold text-foreground-muted">
          ARIES Recovery Protocol
        </h3>
        <p className="mb-4 max-w-md text-center text-sm text-foreground-subtle">
          ARIES (Algorithm for Recovery and Isolation Exploiting Semantics) is the
          standard recovery protocol used by PostgreSQL, MySQL, Oracle, and SQL Server.
          It uses a Write-Ahead Log (WAL) to guarantee durability and atomicity through
          3 phases: Analysis, Redo, and Undo.
        </p>
        <button
          onClick={onRunDemo}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)]"
        >
          <Play className="h-4 w-4" />
          Run ARIES Recovery Demo
        </button>
      </div>
    );
  }

  const phase = currentStep.phase;
  const phaseStyle = PHASE_STYLES[phase];
  const PhaseIcon = phaseStyle.icon;

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-gradient-to-b from-elevated/80 to-background">
      {/* Phase banner */}
      <div
        className={cn(
          "flex items-center gap-3 border-b px-6 py-3 transition-all",
          phaseStyle.bg,
          currentStep.isCrash && "animate-pulse",
        )}
      >
        <PhaseIcon className="h-5 w-5" />
        <div className="flex-1">
          <span className="text-sm font-bold">{phaseStyle.label}</span>
          {state.currentLSN != null && (
            <span className="ml-3 rounded-full bg-background/30 px-2 py-0.5 font-mono text-[10px]">
              LSN={state.currentLSN}
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-foreground-subtle">
          Step {stepIndex + 1}/{steps.length}
        </span>
      </div>

      {/* Crash overlay flash */}
      {currentStep.isCrash && (
        <div className="border-b border-red-500/30 bg-red-500/10 px-6 py-3 text-center">
          <AlertTriangle className="mx-auto mb-1 h-8 w-8 text-red-400" />
          <p className="text-sm font-bold text-red-300">
            System Crash — All in-memory state lost!
          </p>
          <p className="text-[11px] text-red-400/70">
            Only the WAL on disk survives. T1 was active, T2 was committed.
          </p>
        </div>
      )}

      {/* Description bar */}
      <div className={cn("border-b px-6 py-3", phaseStyle.bg)}>
        <p className="text-xs leading-relaxed text-foreground">{currentStep.description}</p>
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* LEFT: WAL Log */}
        <div className="flex w-[280px] shrink-0 flex-col border-r border-border/30">
          <div className="border-b border-border/30 bg-elevated/50 backdrop-blur-sm px-4 py-2">
            <h4 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              <FileText className="h-3.5 w-3.5" />
              Write-Ahead Log (WAL)
            </h4>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {state.wal.length === 0 ? (
              <p className="py-4 text-center text-[10px] italic text-foreground-subtle">
                (WAL is empty)
              </p>
            ) : (
              state.wal.map((entry) => (
                <WALEntryRow
                  key={entry.lsn}
                  entry={entry}
                  isHighlighted={currentStep.highlightLSN === entry.lsn}
                  isCheckpoint={entry.type === "CHECKPOINT"}
                />
              ))
            )}
          </div>
          {/* Checkpoint indicator */}
          {state.checkpointLSN != null && (
            <div className="border-t border-violet-500/30/50 bg-violet-500/5 px-4 py-2">
              <span className="text-[10px] font-semibold text-violet-400">
                Last Checkpoint: LSN={state.checkpointLSN}
              </span>
            </div>
          )}
        </div>

        {/* CENTER: Tables */}
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-3 space-y-4">
          <DirtyPageTable
            entries={state.dirtyPageTable}
            highlightPage={currentStep.highlightPage}
          />
          <TransactionTable
            entries={state.transactionTable}
            highlightTx={currentStep.highlightTx}
          />

          {/* Phase progress indicator */}
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Recovery Phases
            </h4>
            <div className="flex items-center gap-1">
              {(["analysis", "redo", "undo"] as const).map((p, i) => {
                const isActive = phase === p;
                const isDone =
                  (p === "analysis" && (phase === "redo" || phase === "undo" || phase === "complete")) ||
                  (p === "redo" && (phase === "undo" || phase === "complete")) ||
                  (p === "undo" && phase === "complete");
                const pStyle = PHASE_STYLES[p];

                return (
                  <React.Fragment key={p}>
                    {i > 0 && (
                      <div className={cn(
                        "h-0.5 w-4",
                        isDone || isActive ? "bg-primary/50" : "bg-border",
                      )} />
                    )}
                    <div
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold transition-all",
                        isActive
                          ? pStyle.bg + " ring-1 ring-primary/30"
                          : isDone
                            ? "border-green-500/30 bg-green-500/5 text-green-400"
                            : "border-border/30 bg-elevated/50 backdrop-blur-sm text-foreground-subtle",
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        React.createElement(PHASE_STYLES[p].icon, { className: "h-3 w-3" })
                      )}
                      {p === "analysis" ? "Analysis" : p === "redo" ? "Redo" : "Undo"}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Disk Pages */}
        <div className="flex w-[220px] shrink-0 flex-col border-l border-border/30">
          <div className="border-b border-border/30 bg-elevated/50 backdrop-blur-sm px-4 py-2">
            <h4 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              <HardDrive className="h-3.5 w-3.5" />
              Disk Pages
            </h4>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {state.diskPages.map((page) => (
              <DiskPageCard
                key={page.pageId}
                page={page}
                isHighlighted={currentStep.highlightPage === page.pageId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ARIESCanvas;
